const mqtt = require("mqtt");
const MQTT_BROKER_ADDRESS = "mqtt://trejbycloud.duckdns.org:31011";
const TOPIC_SEND = "poslouchat";
const TOPIC_RECIEVE = "posilat";

const mqttClient = mqtt.connect(MQTT_BROKER_ADDRESS);

function sendMessage(prop, value) {
	console.log(`Publish MQTT message [${TOPIC_SEND}]: '${prop}:${value}'`);
	mqttClient.publish(TOPIC_SEND, `${prop}:${value}`);
}

async function main() {
	mqttClient.on("connect", () => {
		mqttClient.subscribe(TOPIC_SEND, (err) => {
			if (!err) {
				mqttClient.publish(TOPIC_SEND, "Projekt Bambus!");
			}
		});
	});
		
	mqttClient.on(TOPIC_RECIEVE, (topic, message) => {
		console.log(`Recieve MQTT message [${topic}]: '${message.toString()}'`);
		const msgText = message.toString();
		const [key, value] = msgText.split(":");
		processMessage(key,parseInt(value));
		mqttClient.end();
		
		console.log(`MSG: '${message.toString()}' TOPIC: '${topic}'`);
	});
}

module.exports = { main, sendMessage }
