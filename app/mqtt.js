const mqtt = require("mqtt");
const Log = require('./log.js');
const TOPIC_SEND = "poslouchat";
const TOPIC_RECIEVE = "posilat";

let mqttClient;
const subs = [];

function sendMessage(prop, value) {
	Log.logMessage(`Publish MQTT message [${TOPIC_SEND}]: '${prop}:${value}'`, Log.LOG_TYPES.Debug);
	mqttClient.publish(TOPIC_SEND, `${prop}:${value}`);
}

function mqttSubscribe(callback) {
	subs.push(callback);
}

async function main() {
	mqttClient = mqtt.connect(process.env.MQTT_BROKER_ADDRESS,{
		keepalive: 60,
		protocolId: "MQTT",
		clientId: "test-client",
		clean: true,
		reconnectPeriod: 1000,
		connectTimeout: 30 * 1000,
		username: process.env.MQTT_USERNAME,
		password: process.env.MQTT_PASSWORD,
	});
	
	mqttClient.on("error", (err) => {
		Log.logMessage(`MQTT Error: ${err}`, Log.LOG_TYPES.Error);
		mqttClient.end();
	});
	
	mqttClient.on("reconnect", () => {
		Log.logMessage("MQTT Reconnecting...", Log.LOG_TYPES.Info);
	});
	mqttClient.on("connect", () => {
		console.log(`MQTT Client connected to '${process.env.MQTT_BROKER_ADDRESS}'`);
		Log.logMessage(`MQTT Client connected to '${process.env.MQTT_BROKER_ADDRESS}'`,Log.LOG_TYPES.Info);
		mqttClient.subscribe(TOPIC_RECIEVE, (err) => {
			console.log(`MQTT Subscribe to ${TOPIC_RECIEVE}!`);
			if (err) {
				Log.logMessage('MQTT Subscribe Error!',Log.LOG_TYPES.Error);
				Log.logMessage(err,Log.LOG_TYPES.Error);
			}
		});
	});

	mqttClient.on("message", (topic, message, packet) => {
		Log.logMessage(`MQTT recieve message [${topic}]: '${message.toString()}'`,Log.LOG_TYPES.Debug);
		const msgText = message.toString();
		for (const callback of subs) { callback( msgText ); }
	});
}

module.exports = { main, sendMessage, mqttSubscribe }
