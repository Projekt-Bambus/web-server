const express = require("express");
const serveStatic = require('serve-static');
const bodyParser = require('body-parser');
const cookieParser = require("cookie-parser");
const socketIo = require('socket.io');
const crypto = require('node:crypto');
const db = require('./database.js');
const Mqtt = require('./mqtt.js');
const Log = require('./log.js');

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
	play: { min: 1, max: 1 }, // Mute on/off
	volume: { min: 0, max: 100 }, // Volume 0 to 100
	song: { min: 1, max: 12 }, // Song IDs 1 to 12
	light1: { min: 0, max: 4 }, // Lights 1 to 3
	light2: { min: 0, max: 4 }, // 0 = off
	light3: { min: 0, max: 4 }, // 1 to 4 states on
}

// State cache
const state = {
	lock: 1,
	magnet: 0,
	volume: 50,
	song: 1,
	play: 0,
	light1: 0,
	light2: 0,
	light3: 0
}

// Creates a new secure random key to secure the socket token
const socketConnectionKey = crypto.randomBytes(32).toString('hex');
Log.logMessage(`Socket secret: ${socketConnectionKey}`,Log.LOG_TYPES.Debug);
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
		Log.logMessage(`${req.path} [${req.method}] from ${req.ip}`,Log.LOG_TYPES.Debug);
		next();
	})
	//## HTTP Routing
	app.post("/login", bodyParser.json(), async (req,res) => {
		// 400 - Invalid request - session exists already
		try {
			if (req.cookies.sessionId && await verifySession(req.cookies.sessionId)) {
				res.status(400).json({message:"Already logged in!"});
				return;
			}
		} catch {
			res.status(500).send('INTERNAL SERVER ERROR - 500');
		}
		// 401 - Invalid login - wrong username or password
		if (!await db.checkPassword(req.body.username,req.body.password)) {
			res.status(401).json({ message: 'Login wrong!' });
			Log.logMessage(`User '${req.body.username}' FAILED LOGIN IP:'${req.ip}'`, Log.LOG_TYPES.Info);
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
			Log.logMessage(`Error when creating session: ${err}`,Log.LOG_TYPES.Error);
			console.error(err);
			res.status(500).json({message: 'Database query failed!'});
			return;
		}
		Log.logMessage(`User '${req.body.username}' LOGIN IP:'${req.ip}'`, Log.LOG_TYPES.Info);
		// Assigns the session ID and username with cookies and redirects to the home page
		res.cookie("username",req.body.username,{expires:expireDate});
		res.cookie("sessionId",sessionId,{expires: expireDate,httpOnly: true});
		res.setHeader("Access-Control-Allow-Credentials", "true");
		res.status(200).json({ message: 'Login success!' });

	});

	app.get("/logout", async (req,res) => {
		Log.logMessage(`User '${req.cookies.username}' LOGOUT IP:'${req.ip}'`, Log.LOG_TYPES.Info);
		await db.deleteSession(req.cookies.sessionId);
		res.clearCookie("sessionId");
		res.redirect("/login");
	});

	app.post("/socket-init", async (req,res) => {
		// Verify legit session
		try {
			if (!(req.cookies.sessionId && await verifySession(req.cookies.sessionId))) {
				console.log("Socket init fail!");
				res.status(400).json({message:"No session id!"});
				return;
			}
		} catch {
			res.status(500).send('INTERNAL SERVER ERROR - 500');
		}
		// Generate the token
		const connectionToken = crypto.createHash('sha512').update(`${socketConnectionKey}${req.cookies.sessionId}`).digest('hex');
		socketConnectionTokens.set(connectionToken, req.cookies.sessionId);
		Log.logMessage(`Socket init success! ${connectionToken}`,Log.LOG_TYPES.Debug);
		// Send the token back
		res.status(200).json({token:`${connectionToken}`});
	});
	//## HTTP Post-Route Middlewear
	//### Redirects
	app.use(async (req, res, next) => {
		// Redirect from "/" to "/login" when no session exists
		try {
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
		} catch (error) {
			Log.logMessage(`INTERNAL SERVER ERROR during redirect! ${error}`,Log.LOG_TYPES.Error);
			console.error(error);
			res.status(500).send(`INTERNAL SERVER ERROR - 500 Err: ${error}`);
		}
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
			Log.logMessage("Success authenticating socket token!",Log.LOG_TYPES.Debug);
			next();
		} else {
			Log.logMessage("Failed authenticating socket token!",Log.LOG_TYPES.Debug);
			socket.disconnect();
		}
	});
	//## Socket.io Events
	//### New socket connection
	io.on('connection', (socket) => {
		Log.logMessage("Socket connection...",Log.LOG_TYPES.Debug);
    	socket.on('clientSync',async(data) => {
			Log.logMessage(`ON: init - ${data}`,Log.LOG_TYPES.Debug);
			const logList = await Log.readFromLog(Log.LOG_TYPES.Info);
    	    socket.emit('serverSync', { config: state, log: logList});
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
				Log.logMessage(`Socket recieved invalid client config!\npropId:'${data.key}' value:'${data.value}'`,Log.LOG_TYPES.Warn);
				return;
			}
			
			Mqtt.sendMessage(data.key,data.value);
			io.emit('serverConfig',data);
			state[data.key] = data.value;

    	});
		socket.on('disconnect', () => {
			console.log("Socket disconnect...");
		})
	});
	
	//## Start of the whole Node.js server
	server.listen(EXPRESS_PORT, () => {

		Log.logMessage(`Projekt bambus listening on port ${EXPRESS_PORT} address: ${server.address().address}`,Log.LOG_TYPES.Debug);
	});

	Log.logSubscribe((entry, type) => {
		if (type <= Log.LOG_TYPES.Info) {
			io.emit('serverLog', {entry,type,timestamp: new Date()});
		}
	})
}

//# server.js exports
module.exports = { main }
