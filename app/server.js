const express = require("express");
const serveStatic = require('serve-static');

const EXPRESS_PORT = 3000;
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

function main() {
	app.use(
		serveStatic((__dirname + '/www/'), {
			setHeaders: function(res, path) {
				file_path = serveStatic.mime.lookup(path);
				if (file_path === 'text/html' || file_path === 'text/css' || file_path === 'application/javascript') {
					res.setHeader('Cache-Control', 'public, max-age=0');
				} else {
					res.setHeader('cache-control', 'public, max-age=2592000');
				}
			}
		}),
		express.static(__dirname + "/www/"), (_, res, next) => {
			res.status(404)
			res.sendFile(__dirname + "/www/404.html")
		}
	);

	app.post("/login", (req,res) => {
		const { username, password } = req.body;

		if (username == "admin" && password == "admin") {

		}
	})

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