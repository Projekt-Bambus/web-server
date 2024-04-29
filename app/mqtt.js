const Mqtt = require("mqtt");
const MQTT_BROKER_ADDRESS = "mqtt://trejbycloud.duckdns.org:31011";
const TOPIC_SEND = "poslouchat";
const TOPIC_RECIEVE = "posilat";

const mqttClient = Mqtt.connect(MQTT_BROKER_ADDRESS);

mqttClient.on("connect", () => {
    mqttClient.subscribe(TOPIC_SEND, (err) => {
        if (!err) {
            mqttClient.publish(TOPIC_SEND, "Projekt Bambus!");
        }
    });
});
  
mqttClient.on(TOPIC_RECIEVE, (topic, message) => {
  console.log(`MSG: '${message.toString()}' TOPIC: '${topic}'`);
  mqttClient.end();
});

