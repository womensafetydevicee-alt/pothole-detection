const MQTT_HOST =
    "wss://9e3ed49b452c4e20bf321f93db6bb743.s1.eu.hivemq.cloud:8884/mqtt";

const MQTT_USERNAME = "pothole1";
const MQTT_PASSWORD = "12345678";

const DEVICE_TOPIC = "pothole/device";
const POTHOLE_TOPIC = "pothole/detections";


// ============================================================
// MAP
// ============================================================

const DEFAULT_LATITUDE = 10.891968;
const DEFAULT_LONGITUDE = 78.725787;

const map = L.map("map").setView(
    [DEFAULT_LATITUDE, DEFAULT_LONGITUDE],
    17
);

L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        maxZoom: 20,
        attribution: "© OpenStreetMap contributors"
    }
).addTo(map);


// ============================================================
// BIKE ICON
// ============================================================

const bikeIcon = L.divIcon({

    className: "",

    html:
        '<div style="' +
        'width:30px;' +
        'height:30px;' +
        'background:#1976d2;' +
        'border:3px solid white;' +
        'border-radius:50%;' +
        'display:flex;' +
        'align-items:center;' +
        'justify-content:center;' +
        'color:white;' +
        'font-weight:bold;' +
        'box-shadow:0 2px 8px rgba(0,0,0,.5);' +
        '">B</div>',

    iconSize: [36, 36],
    iconAnchor: [18, 18]

});


// ============================================================
// VARIABLES
// ============================================================

let bikeMarker = null;

let mapCentered = false;

let potholeMarkers = {};

let potholeCount = 0;


// ============================================================
// MQTT
// ============================================================

console.log("Connecting to MQTT...");

const mqttClient = mqtt.connect(
    MQTT_HOST,
    {
        username: MQTT_USERNAME,
        password: MQTT_PASSWORD,

        clean: true,

        reconnectPeriod: 3000,

        connectTimeout: 10000,

        keepalive: 60
    }
);


// ============================================================
// MQTT CONNECT
// ============================================================

mqttClient.on(
    "connect",
    function()
    {

        console.log(
            "================================"
        );

        console.log(
            "MQTT CONNECTED"
        );

        console.log(
            "================================"
        );


        setText(
            "connection",
            "CONNECTED"
        );


        setColor(
            "connection",
            "green"
        );


        console.log(
            "Subscribing to:",
            DEVICE_TOPIC
        );


        mqttClient.subscribe(
            DEVICE_TOPIC,
            { qos: 1 },
            function(error)
            {

                if (error)
                {

                    console.error(
                        "DEVICE subscribe ERROR:",
                        error
                    );

                }
                else
                {

                    console.log(
                        "DEVICE TOPIC SUBSCRIBED:",
                        DEVICE_TOPIC
                    );

                }

            }
        );


        console.log(
            "Subscribing to:",
            POTHOLE_TOPIC
        );


        mqttClient.subscribe(
            POTHOLE_TOPIC,
            { qos: 1 },
            function(error)
            {

                if (error)
                {

                    console.error(
                        "POTHOLE subscribe ERROR:",
                        error
                    );

                }
                else
                {

                    console.log(
                        "POTHOLE TOPIC SUBSCRIBED:",
                        POTHOLE_TOPIC
                    );

                }

            }
        );

    }
);


// ============================================================
// MQTT MESSAGE
// ============================================================

mqttClient.on(
    "message",
    function(topic, message)
    {

        const text =
            message.toString();


        console.log(
            "MQTT MESSAGE RECEIVED"
        );

        console.log(
            "TOPIC:",
            topic
        );

        console.log(
            "MESSAGE:",
            text
        );


        let data;


        try
        {

            data = JSON.parse(text);

        }
        catch(error)
        {

            console.error(
                "JSON ERROR:",
                error
            );

            return;

        }


        // ----------------------------------------------------
        // BIKE
        // ----------------------------------------------------

        if (
            topic === DEVICE_TOPIC
        )
        {

            console.log(
                "BIKE GPS MESSAGE"
            );

            updateBike(data);

        }


        // ----------------------------------------------------
        // POTHOLE
        // ----------------------------------------------------

        else if (
            topic === POTHOLE_TOPIC
        )
        {

            console.log(
                "POTHOLE MESSAGE"
            );

            addPothole(data);

        }

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
            "MQTT ERROR:",
            error
        );

    }
);


// ============================================================
// MQTT CLOSE
// ============================================================

mqttClient.on(
    "close",
    function()
    {

        console.log(
            "MQTT CONNECTION CLOSED"
        );


        setText(
            "connection",
            "DISCONNECTED"
        );


        setColor(
            "connection",
            "red"
        );

    }
);


// ============================================================
// UPDATE BIKE
// ============================================================

function updateBike(data)
{

    console.log(
        "Updating bike:",
        data
    );


    const latitude =
        Number(data.latitude);

    const longitude =
        Number(data.longitude);


    if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
    )
    {

        console.error(
            "Invalid GPS:",
            data
        );

        return;

    }


    console.log(
        "GPS:",
        latitude,
        longitude
    );


    const position = [
        latitude,
        longitude
    ];


    // --------------------------------------------------------
    // CREATE MARKER
    // --------------------------------------------------------

    if (
        bikeMarker === null
    )
    {

        console.log(
            "Creating bike marker"
        );


        bikeMarker =
            L.marker(
                position,
                {
                    icon: bikeIcon
                }
            ).addTo(map);


        bikeMarker.bindPopup(
            "<b>BIKE_01</b><br>" +
            "Live position"
        );


    }
    else
    {

        console.log(
            "Moving bike marker"
        );


        bikeMarker.setLatLng(
            position
        );

    }


    // --------------------------------------------------------
    // UPDATE DASHBOARD
    // --------------------------------------------------------

    setText(
        "latitude",
        latitude.toFixed(6)
    );


    setText(
        "longitude",
        longitude.toFixed(6)
    );


    setText(
        "satellites",
        data.satellites ?? "--"
    );


    setText(
        "hdop",
        data.hdop ?? "--"
    );


    // --------------------------------------------------------
    // CENTER MAP FIRST TIME
    // --------------------------------------------------------

    if (
        !mapCentered
    )
    {

        console.log(
            "Centering map on bike"
        );


        map.setView(
            position,
            18
        );


        mapCentered = true;

    }

}


// ============================================================
// ADD POTHOLE
// ============================================================

function addPothole(data)
{

    const latitude =
        Number(data.latitude);

    const longitude =
        Number(data.longitude);


    if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
    )
    {

        return;

    }


    const id =
        String(data.id);


    if (
        potholeMarkers[id]
    )
    {

        return;

    }


    const icon =
        L.divIcon({

            className: "",

            html:
                '<div style="' +
                'width:18px;' +
                'height:18px;' +
                'background:red;' +
                'border:3px solid white;' +
                'border-radius:50%;' +
                'box-shadow:0 2px 8px rgba(0,0,0,.6);' +
                '"></div>',

            iconSize: [24, 24],

            iconAnchor: [12, 12]

        });


    const marker =
        L.marker(
            [
                latitude,
                longitude
            ],
            {
                icon: icon
            }
        ).addTo(map);


    marker.bindPopup(

        "<b>POTHOLE #" +
        id +
        "</b><br><br>" +

        "Latitude: " +
        latitude.toFixed(6) +

        "<br>" +

        "Longitude: " +
        longitude.toFixed(6) +

        "<br>" +

        "Confidence: " +
        (data.confidence ?? "--") +
        "%"

    );


    potholeMarkers[id] =
        marker;


    potholeCount++;


    setText(
        "count",
        potholeCount
    );

}


// ============================================================
// HELPER FUNCTIONS
// ============================================================

function setText(id, value)
{

    const element =
        document.getElementById(id);


    if (element)
    {

        element.innerText =
            value;

    }
    else
    {

        console.warn(
            "HTML element missing:",
            id
        );

    }

}


function setColor(id, color)
{

    const element =
        document.getElementById(id);


    if (element)
    {

        element.style.color =
            color;

    }

}
