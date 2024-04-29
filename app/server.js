const express = require("express");
const serveStatic = require('serve-static');

const EXPRESS_PORT = 3000;

const app = express();

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
		
	app.listen(EXPRESS_PORT, () => {
		console.log(`Projekt bambus listening on port ${EXPRESS_PORT}`);
	});
}

module.exports = { main }