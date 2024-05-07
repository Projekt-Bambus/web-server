const Mqtt = require("mqtt");
const Server = require("server.js")
const MQTT_BROKER_ADDRESS = "mqtt://trejbycloud.duckdns.org:31011";
const TOPIC_SEND = "poslouchat";
const TOPIC_RECIEVE = "posilat";

const mqttClient = Mqtt.connect(MQTT_BROKER_ADDRESS);

function processMessage(prop, value) {
    
}

function sendMessage(prop, value) {
    mqttClient.publish(TOPIC_SEND, `${prop}:${value}`);
}

function main() {
    mqttClient.on("connect", () => {
        mqttClient.subscribe(TOPIC_SEND, (err) => {
            if (!err) {
                mqttClient.publish(TOPIC_SEND, "Projekt Bambus!");
            }
        });
    });
    
    mqttClient.on(TOPIC_RECIEVE, (topic, message) => {
        const msgText = message.toString();
        const [prop, value] = msgText.split(":");
        processMessage(prop,parseInt(value));
        mqttClient.end();
    
        console.log(`MSG: '${message.toString()}' TOPIC: '${topic}'`);
    });
}

module.exports = { main, sendMessage }

