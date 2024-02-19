var fs = require('fs');
var hskey = fs.readFileSync('/etc/letsencrypt/live/skt-dev.deckheros.com/privkey.pem');
var hscert = fs.readFileSync('/etc/letsencrypt/live/skt-dev.deckheros.com/fullchain.pem');
var optionsSSL = {
    key: hskey,
    cert: hscert
};
const https = require('https');

const express = require('express');
const port = 6060;
let app = express();

https.createServer(optionsSSL,app).listen(5050);

app.set('port', process.env.PORT || 6060);

const httpServer = app.listen(port, () => console.log(`Listening on port ${port}`));


//TODO: DO store this information in database for current user_id <-> client_id mapping
const connectedUserSocket = new Map();
const connectedUserDevice = new Map();

let options = {
    cors: [
        "http://localhost:3000",
        "https://cg-dev.deckheros.com"
    ]
};
const secret = "jwtsecret";
const init = async () => {
    console.log("else0");
    //getting secret key from redis
    app.use(function (req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "*");
        next();
    });
    // app.use((req, res) => {
    //     res.writeHead(200);
    //     res.end("hello world\n");
    // });

    app.get("/health", function (req, res) {
        res.send('healthy');
    })


    const sio = require("socket.io")(httpServer, options);


    // client connection starts from here..
    sio.use(function (socket, next) {
        console.log("else1111");
        const host = socket.request.headers.origin;

        if (socket.handshake.query && socket.handshake.query.token) {
            console.log("else2");

            // jwt.verify(socket.handshake.query.token, secret, function (err, decoded) {
            //     console.log(`Token auth error: host:${host} and token:${socket.handshake.query.token}`);
            //     if (err) return next(new Error('Authentication error'));
            //     socket.decoded = decoded;

            var device = socket.handshake.query.deviceid;
            var usernameFromDecodedToken = "abc";
            socket.username = usernameFromDecodedToken;
            socket.device = device;
            var alreadyUserConnectedFoundFromDb = connectedUserSocket.get(usernameFromDecodedToken);

            if (!!alreadyUserConnectedFoundFromDb) {
                var connectedSocketDeviceId = connectedUserDevice.get(usernameFromDecodedToken);

                if (!!connectedSocketDeviceId && connectedSocketDeviceId == device) {
                    next();
                }
                else {
                    next(new Error('user is already connected somewhere'));
                }
            }
            else {

                next();
                console.log("else1");
            }
            //     next();
            // });

        }
        else {
            console.log(`Auth error: host:${host}`);
            next(new Error('Authentication error'));
        }

    }).on("connection", (socket) => {

        try {
            var device = socket.device;
            var username = socket.username;
            connectedUserSocket.set(username, socket);
            connectedUserDevice.set(username, device);
            //user room 
            socket.on('your_room', function (message) {
                socket.emit('site_room', `your message ${message} recieved`);
            });

            socket.on("disconnect", () => {
                //add socket disconnection code
            });
        }
        catch (ex) {
            console.error(`error in socket: ${ex}`);
        }
    });
}

init();