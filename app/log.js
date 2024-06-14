//const Database = require('./database.js');
const mysql = require('mysql2');
const LOG_TYPES = {
    Debug: 4,
    Info: 3,
    Warn: 2,
    Error: 1,
}

const database = mysql.createPool({
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME
});

const subs = [];

function logSubscribe(callback) {
    subs.push(callback);
}

function main() {
    
}

async function logMessage(entry,type) {
    await saveToLog(entry,type);
    for (const callback of subs) { callback( entry, type ); }
    const message = `[${new Date().toLocaleString()}] ${entry}`;
    switch (type) {
        case LOG_TYPES.Debug:
            console.log(message);
            break;
        case LOG_TYPES.Warn:
            console.log(message);
            break;
        case LOG_TYPES.Error:
            console.error(message);
            break;
        case LOG_TYPES.Info:
            console.info(message);
            break;
    }
}

async function saveToLog(entry, type) {
    const saveResult = await new Promise((resolve, reject) => 
        database.query(
            "INSERT INTO log (entry, type, timestamp) VALUES (?, ?, NOW());",
            [entry,type],
            (err, result) => {
                if (err) {
                    reject(err);
                }
                resolve(result);
            }
        )
    ).catch((reason) => {
        console.error(`Failed log save!`);
        console.error(reason);
    });
    return saveResult;
}

async function readFromLog(maxType) {
    const logResult = await new Promise((resolve, reject) => 
        database.query("SELECT * from log WHERE type <= ?", [maxType], (err, result) => {
            if (err) {
                reject(err);
            }
            resolve(result);
        })
    ).catch((reason) => {
        console.error(`Failed log query!`);
        console.error(reason);
    });
    return logResult;
}

module.exports = { LOG_TYPES, main, logMessage, logSubscribe, readFromLog }