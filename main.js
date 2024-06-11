const Mqtt = require('./app/mqtt.js');
const Server = require('./app/server.js');
const Database = require('./app/database.js');

async function main() {
    console.log("Loading server.js module.");
    Server.main();
    console.log("Loading database.js module.");
    Database.main();
    console.log("Loading mqtt.js module.");
    Mqtt.main();
    console.log("Loading done.");
}

main();
