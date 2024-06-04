const express = require("express");
const serveStatic = require('serve-static');
const bodyParser = require('body-parser');
const cookieParser = require("cookie-parser");
const db = require('./database.js');

const EXPRESS_PORT = process.env.WEB_PORT;
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

const WEB_DIR = __dirname + '/www/';

async function verifySession(sessionId) {
	const sessionData = await db.getSession(sessionId);
	if (!sessionData?.length) {
		return false;
	}
	if ( new Date() > sessionData[0]?.expires ) {
		await db.deleteSession(sessionId);
		return false;
	}
	return true;

}

function main() {
	app.use(cookieParser());

	app.post("/login", bodyParser.json(), async (req,res) => {
		console.log(`Login POST from ${req.ip}`);

		if (req.cookies.sessionId && await verifySession(req.cookies.sessionId)) {
			res.status(400).json({message:"Already logged in!"});
			return;
		}

		if (await db.checkPassword(req.body.username,req.body.password)) {
			let sessionId;

			// Prepares session expire date 2 weeks into the future
			const expireDate = new Date();
			expireDate.setDate(expireDate.getDate() + 14);

			// Creates the session and gets its ID
			try {
				sessionId = await db.createSession(req.body.username,expireDate);
			} catch (err) {
				console.error('Error when creating session:');
				console.error(err);
				res.status(500).json({message: 'Database query failed!'});
				return;
			}

			// Assigns the session ID with cookies and redirects to the home page
			res.setHeader("Set-Cookie", `sessionId=${sessionId}; Expires=${expireDate.toUTCString()}; HttpOnly`);
			res.setHeader("Access-Control-Allow-Credentials", "true");
			res.redirect("/");
			//res.status(200).json({ message: 'Login success!' });
		} else {
			res.status(401).json({ message: 'Login wrong!' });
			console.log("Password check NICHT gut!");
		}

	});

	app.get("/logout", async (req,res) => {
		await db.deleteSession(req.cookies.sessionId);
		res.clearCookie("sessionId");
		res.redirect("/login");
	});

	app.use(async (req, res, next) => {
		if (req.path === "/") {
			if (!(req.cookies.sessionId && await verifySession(req.cookies.sessionId))) {
				return res.redirect("/login");
			}
		}
	
		if (req.path === "/login") {
			if (req.cookies.sessionId && await verifySession(req.cookies.sessionId)) {
				return res.redirect("/");
			}
		}
	
		next();
	});

	app.use(
		serveStatic((WEB_DIR), {
			setHeaders: function(res, path) {
				file_path = serveStatic.mime.lookup(path);
				if (file_path === 'text/html' || file_path === 'text/css' || file_path === 'application/javascript') {
					res.setHeader('Cache-Control', 'public, max-age=0');
				} else {
					res.setHeader('cache-control', 'public, max-age=2592000');
				}
			}
		}),
		express.static(WEB_DIR), (_, res, next) => {
			res.status(404);
			res.sendFile(WEB_DIR + "/404.html")
		}
	);

	setInterval(() => {
	    io.emit('time', { time: new Date().toJSON()});
	    console.log( 'EMIT: time');
	}, 5000);

	io.on('connection', (socket) => {
		console.log("Socket connection...")
    	socket.on('init',(data) => {
    	    console.log(`ON: init - ${data}`);
    	    socket.emit('fromServer', { message: 'Received message! Returning message!!'});
    	    console.log('EMIT: fromServers');
    	});
	});
	
	server.listen(EXPRESS_PORT, () => {
		console.log(`Projekt bambus listening on port ${EXPRESS_PORT}`);
	});
}

function emitSocketMsg() {

}

module.exports = { main, emitSocketMsg }