// ============================================================
// HIVEMQ CONFIGURATION
// ============================================================

// IMPORTANT:
// Use your HiveMQ WebSocket endpoint here.
//
// Example:
// wss://xxxxxxxx.s1.eu.hivemq.cloud:8884/mqtt

const MQTT_HOST =
    "9e3ed49b452c4e20bf321f93db6bb743.s1.eu.hivemq.cloud";


const MQTT_USERNAME =
    "pothole1";


const MQTT_PASSWORD =
    "12345678";


const MQTT_TOPIC =
    "pothole/detections";


// ============================================================
// MAP
// ============================================================

let map = null;

let markers = {};

let potholeCount = 0;


// Default map location
// Your Pi will move the map when the first
// GPS position arrives.

const DEFAULT_LATITUDE =
    10.891968;

const DEFAULT_LONGITUDE =
    78.725787;


map = L.map(
    "map"
).setView(

    [
        DEFAULT_LATITUDE,
        DEFAULT_LONGITUDE
    ],

    16

);


L.tileLayer(

    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",

    {

        maxZoom: 20,

        attribution:
            "© OpenStreetMap contributors"

    }

).addTo(map);


// ============================================================
// MQTT CONNECTION
// ============================================================

const mqttClient = mqtt.connect(

    MQTT_HOST,

    {

        username:
            MQTT_USERNAME,

        password:
            MQTT_PASSWORD,

        clean: true,

        reconnectPeriod: 3000,

        connectTimeout: 10000,

        keepalive: 60

    }

);


// ============================================================
// MQTT CONNECTED
// ============================================================

mqttClient.on(
    "connect",
    function()
    {

        console.log(
            "MQTT connected"
        );


        const status =
            document.getElementById(
                "connection"
            );


        status.innerText =
            "CONNECTED";


        status.style.color =
            "green";


        mqttClient.subscribe(

            MQTT_TOPIC,

            {
                qos: 1
            },

            function(error)
            {

                if (error)
                {

                    console.error(
                        "Subscribe error:",
                        error
                    );

                }
                else
                {

                    console.log(
                        "Subscribed:",
                        MQTT_TOPIC
                    );

                }

            }

        );

    }

);


// ============================================================
// MQTT DISCONNECTED
// ============================================================

mqttClient.on(
    "close",
    function()
    {

        const status =
            document.getElementById(
                "connection"
            );


        status.innerText =
            "DISCONNECTED";


        status.style.color =
            "red";

    }
);


// ============================================================
// MQTT ERROR
// ============================================================

mqttClient.on(
    "error",
    function(error)
    {

        console.error(
            "MQTT error:",
            error
        );

    }
);


// ============================================================
// RECEIVE POTHOLE
// ============================================================

mqttClient.on(
    "message",
    function(topic, message)
    {

        if (
            topic !==
            MQTT_TOPIC
        )
        {

            return;

        }


        try
        {

            const text =
                message.toString();


            const data =
                JSON.parse(text);


            console.log(
                "Pothole received:",
                data
            );


            addPothole(
                data
            );


        }
        catch(error)
        {

            console.error(
                "Invalid MQTT message:",
                error
            );

        }

    }
);


// ============================================================
// ADD POTHOLE MARKER
// ============================================================

function addPothole(data)
{

    if (
        data.latitude === undefined
        ||
        data.longitude === undefined
    )
    {

        return;

    }


    const id =
        String(data.id);


    // Prevent duplicate MQTT messages

    if (
        markers[id]
    )
    {

        return;

    }


    const latitude =
        Number(data.latitude);


    const longitude =
        Number(data.longitude);


    if (
        !Number.isFinite(
            latitude
        )
        ||
        !Number.isFinite(
            longitude
        )
    )
    {

        return;

    }


    const marker =
        L.marker(

            [
                latitude,
                longitude
            ]

        ).addTo(map);


    marker.bindPopup(

        "<b>Pothole #" +
        id +
        "</b><br><br>" +

        "Device: " +
        (data.device_id || "Unknown") +
        "<br>" +

        "Latitude: " +
        latitude.toFixed(6) +
        "<br>" +

        "Longitude: " +
        longitude.toFixed(6) +
        "<br>" +

        "Confidence: " +
        (data.confidence || "--") +
        "%<br>" +

        "Time: " +
        (data.timestamp || "--")

    );


    markers[id] =
        marker;


    potholeCount++;


    document.getElementById(
        "count"
    ).innerText =
        potholeCount;


    document.getElementById(
        "latitude"
    ).innerText =
        latitude.toFixed(6);


    document.getElementById(
        "longitude"
    ).innerText =
        longitude.toFixed(6);


    // Move map to the new pothole

    map.setView(

        [
            latitude,
            longitude
        ],

        18

    );


    // Automatically open the new marker

    marker.openPopup();

}
