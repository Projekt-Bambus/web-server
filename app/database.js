const mysql = require('mysql2');
const crypto = require('node:crypto');

const database = mysql.createPool({
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME
});

function toSqlDatetime(date) {
    return date.toISOString().slice(0, 19).replace('T', ' ');
}

async function main() {
    await cleanupSessions();
}

async function cleanupSessions() {
    database.query("DELETE FROM sessions WHERE expires < NOW();", (err, result) => {
        console.log("Session CLEANUP");
        if (err) {
            Log.logMessage(`Error during db session cleanup: ${err}`,Log.LOG_TYPES.Error);
            console.error(err);
        }
    })
}

async function checkPassword(username,password) {
    const isCorrect = await new Promise((resolve, reject) => 
        database.query("SELECT * from login WHERE username = ?",[username], (err, result) => {
            if (err) {
                reject(err);
            }
            if (result.length == 0 || result[0]?.username != username) {
                reject("Invalid username!");
            }
            const realPasswordHash = result[0]?.password_hash;
            const inputPasswordHash = crypto.createHash('sha512').update(password).digest('hex');
            resolve(realPasswordHash == inputPasswordHash);
        })
    ).catch((reason) => {
        Log.logMessage(`DB Failed Password Check user '${username}': ${reason}`,Log.LOG_TYPES.Error);
        console.error(reason);
    });
    return isCorrect === true;
}

async function getSession(sessionId) {
    const sessionData = await new Promise((resolve, reject) => 
        database.query("SELECT * from sessions WHERE id = ?",[sessionId], (err, result) => {
            console.log("Session SELECT");
            if (err) {
                reject(err);
            }
            resolve(result);
        })
    ).catch((reason) => {
        Log.logMessage(`DB Failed Session SELECT: ${reason}`,Log.LOG_TYPES.Error);
        console.error(reason);
    });
    return sessionData;
}

async function createSession(username, expireDate) {
    // Checks if the user exists and gets their password hash
    const passwordHash = await new Promise((resolve, reject) =>
        database.query("SELECT * from login WHERE username = ?",[username], (err, result) => {
            if (err) {
                reject(err);
            }
            if (result.length == 0 || result[0]?.username != username) {
                reject("Invalid username!");
            }
            resolve(result[0]?.password_hash);
        })
    );
    // Creates a session ID generated as hash from username,password hash,current datetime and random string
    const sessionId = crypto.createHash('sha512').update(
        `${username}:${passwordHash}:${new Date().getMilliseconds()}:${Math.random()}`
    ).digest('hex');
    // Inserts new session into the database
    await new Promise((resolve, reject) => 
        database.query(
            "INSERT INTO sessions (id, username, expires, timestamp) VALUES (?, ?, ?, NOW());",
            [sessionId,username,toSqlDatetime(expireDate)],
            (err, result) => {
                if (err) {
                    reject(err);
                }
                resolve(true);
            }
        )
    ).catch((reason) => {
        Log.logMessage(`DB Failed Session INSERT: ${reason}`,Log.LOG_TYPES.Error);
        console.error(reason);
    });
    // Returns ID back for caller to use
    return sessionId;
}

async function deleteSession(id) {
    database.query("DELETE FROM sessions WHERE id = ?",[id], (err, result) => {
        console.log("Session DELETE");
        if (err) {
            throw err;
        }
        console.log(result);
    });
}

module.exports = { main, getSession, checkPassword, createSession, deleteSession };
