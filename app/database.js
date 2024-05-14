const mysql = require('mysql2');
const crypto = require('crypto-js');

const database = mysql.createPool({
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME
});

//console.log(process.env);
console.log(crypto.SHA512("admin").toString());


function main() {
    database.query("SELECT * from login",null, (err, result) => {
        if (err) {
            console.error(err);
            return;
        }
        console.log(result);
    })
    console.log("Running main database!");
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
            const inputPasswordHash = crypto.SHA512(password).toString();
            resolve(realPasswordHash == inputPasswordHash);
        })
    ).catch((reason) => {
        console.error(`Failed password check!`);
        console.error(reason);
    });
    return isCorrect === true;
}

async function createSession(username) {

}

module.exports = { main, checkPassword };
