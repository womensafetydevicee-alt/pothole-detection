// ============================================================
// HIVEMQ CONFIGURATION
// ============================================================

const MQTT_HOST =
    "wss://9e3ed49b452c4e20bf321f93db6bb743.s1.eu.hivemq.cloud:8884/mqtt";


const MQTT_USERNAME =
    "pothole1";


const MQTT_PASSWORD =
    "12345678";


// ============================================================
// MQTT TOPICS
// ============================================================

const DEVICE_TOPIC =
    "pothole/device";


const POTHOLE_TOPIC =
    "pothole/detections";


// ============================================================
// MAP
// ============================================================

let map = null;

let potholeMarkers = {};

let bikeMarker = null;

let potholeCount = 0;

let mapCentered = false;


// Default location

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
// BIKE ICON
// ============================================================

const bikeIcon =
    L.divIcon({

        className: "",

        html:
            '<div style="' +
            'width:32px;' +
            'height:32px;' +
            'background:#1976d2;' +
            'border:3px solid white;' +
            'border-radius:50%;' +
            'box-shadow:0 2px 8px rgba(0,0,0,0.5);' +
            'display:flex;' +
            'align-items:center;' +
            'justify-content:center;' +
            'color:white;' +
            'font-size:18px;' +
            'font-weight:bold;' +
            '">B</div>',

        iconSize: [
            38,
            38
        ],

        iconAnchor: [
            19,
            19
        ]

    });


// ============================================================
// RED POTHOLE ICON
// ============================================================

const potholeIcon =
    L.divIcon({

        className: "",

        html:
            '<div style="' +
            'width:18px;' +
            'height:18px;' +
            'background:red;' +
            'border:3px solid white;' +
            'border-radius:50%;' +
            'box-shadow:0 2px 8px rgba(0,0,0,0.6);' +
            '"></div>',

        iconSize: [
            24,
            24
        ],

        iconAnchor: [
            12,
            12
        ]

    });


// ============================================================
// MQTT CONNECTION
// ============================================================

console.log(
    "Connecting to HiveMQ..."
);


const mqttClient =
    mqtt.connect(

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


        if (status)
        {

            status.innerText =
                "CONNECTED";

            status.style.color =
                "green";

        }


        // Subscribe to bike position

        mqttClient.subscribe(

            DEVICE_TOPIC,

            {
                qos: 1
            },

            function(error)
            {

                if (error)
                {

                    console.error(
                        "Device subscribe error:",
                        error
                    );

                }
                else
                {

                    console.log(
                        "Subscribed:",
                        DEVICE_TOPIC
                    );

                }

            }

        );


        // Subscribe to potholes

        mqttClient.subscribe(

            POTHOLE_TOPIC,

            {
                qos: 1
            },

            function(error)
            {

                if (error)
                {

                    console.error(
                        "Pothole subscribe error:",
                        error
                    );

                }
                else
                {

                    console.log(
                        "Subscribed:",
                        POTHOLE_TOPIC
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

        console.log(
            "MQTT disconnected"
        );


        const status =
            document.getElementById(
                "connection"
            );


        if (status)
        {

            status.innerText =
                "DISCONNECTED";

            status.style.color =
                "red";

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
            "MQTT error:",
            error
        );

    }

);


// ============================================================
// MQTT MESSAGE
// ============================================================

mqttClient.on(

    "message",

    function(

        topic,

        message

    )
    {

        try
        {

            const data =
                JSON.parse(

                    message.toString()

                );


            console.log(

                "MQTT:",

                topic,

                data

            );


            // ------------------------------------------------
            // BIKE POSITION
            // ------------------------------------------------

            if (

                topic ===
                DEVICE_TOPIC

            )
            {

                updateBike(
                    data
                );

            }


            // ------------------------------------------------
            // POTHOLE
            // ------------------------------------------------

            else if (

                topic ===
                POTHOLE_TOPIC

            )
            {

                addPothole(
                    data
                );

            }

        }

        catch(error)
        {

            console.error(

                "Invalid MQTT JSON:",

                error

            );

        }

    }

);


// ============================================================
// UPDATE BIKE POSITION
// ============================================================

function updateBike(data)
{

    const latitude =
        Number(
            data.latitude
        );


    const longitude =
        Number(
            data.longitude
        );


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

        console.warn(
            "Invalid GPS position:",
            data
        );

        return;

    }


    const position = [

        latitude,

        longitude

    ];


    // --------------------------------------------------------
    // CREATE BIKE MARKER
    // --------------------------------------------------------

    if (
        bikeMarker === null
    )
    {

        bikeMarker =
            L.marker(

                position,

                {
                    icon:
                        bikeIcon
                }

            ).addTo(map);


        bikeMarker.bindPopup(

            "<b>BIKE_01</b><br>" +

            "Live GPS position<br><br>" +

            "Latitude: " +
            latitude.toFixed(6) +

            "<br>" +

            "Longitude: " +
            longitude.toFixed(6)

        );

    }

    else
    {

        // Move existing marker

        bikeMarker.setLatLng(
            position
        );

    }


    // --------------------------------------------------------
    // UPDATE DASHBOARD
    // --------------------------------------------------------

    const latElement =
        document.getElementById(
            "latitude"
        );


    const lonElement =
        document.getElementById(
            "longitude"
        );


    const satellitesElement =
        document.getElementById(
            "satellites"
        );


    const hdopElement =
        document.getElementById(
            "hdop"
        );


    if (latElement)
    {

        latElement.innerText =
            latitude.toFixed(6);

    }


    if (lonElement)
    {

        lonElement.innerText =
            longitude.toFixed(6);

    }


    if (satellitesElement)
    {

        satellitesElement.innerText =
            data.satellites ?? "--";

    }


    if (hdopElement)
    {

        hdopElement.innerText =
            data.hdop ?? "--";

    }


    // --------------------------------------------------------
    // CENTER MAP ONLY FIRST TIME
    // --------------------------------------------------------

    if (
        !mapCentered
    )
    {

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

    if (

        data.latitude === undefined

        ||

        data.longitude === undefined

    )
    {

        console.warn(
            "Pothole has no GPS:",
            data
        );

        return;

    }


    const latitude =
        Number(
            data.latitude
        );


    const longitude =
        Number(
            data.longitude
        );


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


    const id =
        String(
            data.id
        );


    // --------------------------------------------------------
    // DUPLICATE CHECK
    // --------------------------------------------------------

    if (
        potholeMarkers[id]
    )
    {

        console.log(

            "Duplicate pothole ignored:",

            id

        );

        return;

    }


    // --------------------------------------------------------
    // CREATE RED MARKER
    // --------------------------------------------------------

    const marker =
        L.marker(

            [

                latitude,

                longitude

            ],

            {

                icon:
                    potholeIcon

            }

        ).addTo(map);


    // --------------------------------------------------------
    // POPUP
    // --------------------------------------------------------

    marker.bindPopup(

        "<b>POTHOLE #" +
        id +
        "</b><br><br>" +

        "Device: " +

        (
            data.device_id
            ||
            "Unknown"
        ) +

        "<br>" +

        "Latitude: " +

        latitude.toFixed(6) +

        "<br>" +

        "Longitude: " +

        longitude.toFixed(6) +

        "<br>" +

        "Confidence: " +

        (
            data.confidence
            ??
            "--"
        ) +

        "%<br>" +

        "Time: " +

        (
            data.timestamp
            ||
            "--"
        )

    );


    potholeMarkers[id] =
        marker;


    potholeCount++;


    // --------------------------------------------------------
    // UPDATE COUNT
    // --------------------------------------------------------

    const countElement =
        document.getElementById(
            "count"
        );


    if (countElement)
    {

        countElement.innerText =
            potholeCount;

    }


    console.log(

        "Pothole added:",

        id,

        latitude,

        longitude

    );


    // --------------------------------------------------------
    // DON'T MOVE THE MAP
    // --------------------------------------------------------
    //
    // Important:
    //
    // The bike should remain visible.
    //
    // Therefore we do NOT use:
    //
    // map.setView(...)
    //
    // here.
    //
    // --------------------------------------------------------

}
