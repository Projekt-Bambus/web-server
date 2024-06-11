const express = require("express");
const serveStatic = require('serve-static');
const bodyParser = require('body-parser');
const cookieParser = require("cookie-parser");
const socketIo = require('socket.io');
const crypto = require('node:crypto');
const db = require('./database.js');
const Mqtt = require('./mqtt.js');

// Server setup
const app = express();
const server = require('http').createServer(app);
const io = new socketIo.Server(server, {
	connectionStateRecovery: {}
});

// Constants
const EXPRESS_PORT = process.env.WEB_PORT;
const WEB_DIR = __dirname + '/www/';
const CONFIG_DATA_RANGES = {
	lock: { min: 0, max: 1 }, // Lock on/off
	magnet: { min: 0, max: 1 }, // Magnet on/off
	mute: { min: 0, max: 1 }, // Mute on/off
	volume: { min: 0, max: 100 }, // Volume 0 to 100
	song: { min: 1, max: 12 }, // Song IDs 1 to 12
	light1: { min: 0, max: 4 }, // Lights 1 to 3
	light2: { min: 0, max: 4 }, // 0 = off
	light3: { min: 0, max: 4 }, // 1 to 4 states on
}

// Creates a new secure random key to secure the socket token
const socketConnectionKey = crypto.randomBytes(32).toString('hex');
console.log(`Socket secret: ${socketConnectionKey}`);
// Saves current socket tokens in memory, cleanup might be ideal on larger scale
const socketConnectionTokens = new Map();

// Function to make sure session is valid and hasn't expired
async function verifySession(sessionId) {
	const sessionData = await db.getSession(sessionId);
	if (!sessionData?.length) {
		return false;
	}
	if (new Date() > sessionData[0]?.expires) {
		await db.deleteSession(sessionId);
		return false;
	}
	return true;
}

// Function to start server module, (run once in main.js)
async function main() {
	//## HTTP Pre-Route Middlewear 
	app.use(cookieParser());
	app.use((req,res,next) => {
		console.log(`${req.path} [${req.method}] from ${req.ip}`);
		next();
	})
	//## HTTP Routing
	app.post("/login", bodyParser.json(), async (req,res) => {
		// 400 - Invalid request - session exists already
		if (req.cookies.sessionId && await verifySession(req.cookies.sessionId)) {
			res.status(400).json({message:"Already logged in!"});
			return;
		}
		// 401 - Invalid login - wrong username or password
		if (!await db.checkPassword(req.body.username,req.body.password)) {
			res.status(401).json({ message: 'Login wrong!' });
			console.log("Password check NICHT gut!");
			return;
		}

		// Prepares session expire date 2 weeks into the future
		const expireDate = new Date();
		expireDate.setDate(expireDate.getDate() + 14);
		// Creates the session and gets its ID
		let sessionId;
		try {
			sessionId = await db.createSession(req.body.username,expireDate);
		} catch (err) {
			console.error('Error when creating session:');
			console.error(err);
			res.status(500).json({message: 'Database query failed!'});
			return;
		}
		// Assigns the session ID and username with cookies and redirects to the home page
		res.cookie("username",req.body.username,{expires:expireDate});
		res.cookie("sessionId",sessionId,{expires: expireDate,httpOnly: true});
		res.setHeader("Access-Control-Allow-Credentials", "true");
		res.status(200).json({ message: 'Login success!' });

	});

	app.get("/logout", async (req,res) => {
		await db.deleteSession(req.cookies.sessionId);
		res.clearCookie("sessionId");
		res.redirect("/login");
	});

	app.post("/socket-init", async (req,res) => {
		// Verify legit session
		if (!(req.cookies.sessionId && await verifySession(req.cookies.sessionId))) {
			console.log("Socket init fail!");
			res.status(400).json({message:"No session id!"});
			return;
		}
		// Generate the token
		const connectionToken = crypto.createHash('sha512').update(`${socketConnectionKey}${req.cookies.sessionId}`).digest('hex');
		socketConnectionTokens.set(connectionToken, req.cookies.sessionId);
		console.log(`Socket init success! ${connectionToken}`);
		// Send the token back
		res.status(200).json({token:`${connectionToken}`});
	});
	//## HTTP Post-Route Middlewear
	//### Redirects
	app.use(async (req, res, next) => {
		// Redirect from "/" to "/login" when no session exists
		if (req.path === "/") {
			if (!(req.cookies.sessionId && await verifySession(req.cookies.sessionId))) {
				return res.redirect("/login");
			}
		}
		// Redirect from "/login" to "/" when session exists
		if (req.path === "/login") {
			if (req.cookies.sessionId && await verifySession(req.cookies.sessionId)) {
				return res.redirect("/");
			}
		}
		next();
	});
	//### Static website
	app.use(
		// The Website
		serveStatic((WEB_DIR), {
			setHeaders: function(res, path) {
				// Setting cache
				const filePath = serveStatic.mime.lookup(path);
				if (filePath === 'text/html' || filePath === 'text/css' || filePath === 'application/javascript') {
					res.setHeader('Cache-Control', 'public, max-age=0');
				} else {
					res.setHeader('cache-control', 'public, max-age=2592000');
				}
			}
		}),
		// 404 - page redirect
		express.static(WEB_DIR), (_, res, next) => {
			res.status(404).sendFile(WEB_DIR + "/404.html");
		}
	);

	//## Socket.io Middlewear
	//### Authenticate socket with token from POST - /socket-init
	io.use((socket, next) => {
		const token = socket.handshake.auth.token;
		if (socketConnectionTokens.has(token)) {
			console.log("Success authenticating socket token!");
			next();
		} else {
			console.log("Failed authenticating socket token!");
			socket.disconnect();
		}
	});
	//## Socket.io Events
	//### New socket connection
	io.on('connection', (socket) => {
		console.log("Socket connection...");
    	socket.on('clientSync',(data) => {
    	    console.log(`ON: init - ${data}`);
    	    socket.emit('serverSync', { config: {}, log: {}});
    	});
		socket.on('clientConfig',(data) => {
			console.log('on: clientConfig');
			console.log(data);
			if (
				!(data?.key in CONFIG_DATA_RANGES) || // Invalid key
				typeof data?.value != "number" || // Invalid type of value
				(
					data.value < CONFIG_DATA_RANGES[data.key].min ||
					data.value > CONFIG_DATA_RANGES[data.key].max
				) // Value out of range
			) {
				console.warn(`Socket recieved invalid client config!\npropId:'${data.key}' value:'${data.value}'`);
				return;
			}
			
			Mqtt.sendMessage(data.key,data.value);
			io.emit('serverConfig',data);

    	});
		socket.on('disconnect', () => {
			console.log("Socket disconnect...");
		})
	});
	
	//## Start of the whole Node.js server
	server.listen(EXPRESS_PORT, () => {
		console.log(`Projekt bambus listening on port ${EXPRESS_PORT}`);
	});
}

// Function to externally emit socket message.
function emitSocketMsg(event,message) {
	io.emit(event,message);
	console.log(`Emitted: [${event}] - ${message.stringify()}`);
}

//# server.js exports
module.exports = { main, emitSocketMsg }
