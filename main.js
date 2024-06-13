const Mqtt = require('./app/mqtt.js');
const Server = require('./app/server.js');
const Database = require('./app/database.js');
const Log = require('./app/log.js');

async function main() {
    console.log("Loading log.js module.");
    Log.main();
    console.log("Loading server.js module.");
    Server.main();
    console.log("Loading database.js module.");
    Database.main();
    console.log("Loading mqtt.js module.");
    Mqtt.main();
    console.log("Loading done.");
    Log.logMessage('Server started!', Log.LOG_TYPES.Info);
}

main();
