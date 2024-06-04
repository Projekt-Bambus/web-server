//import * as Mqtt from './app/mqtt';
const Server = require('./app/server.js');
const Database = require('./app/database.js');
Server.main();
Database.main();