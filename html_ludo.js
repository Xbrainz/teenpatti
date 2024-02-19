const http = require('http');
let db_config = require("./config/db_uri");
const options = {
  pingInterval: 2000,
  pingTimeout: 5000,
  reconnectInterval : 5000,
 // forceNew: true
};
//const User = require("./ludo/model/user");
const express = require('express');
const app = express();
const code = require("./ludo/lib/code");
const cors = require("cors");
const dotEnv = require("dotenv");
const Sentry = require('@sentry/node');
const SentryTracing = require("@sentry/tracing");
const Table = require("./ludo/model/table");
dotEnv.config();
require("./config/db");
app.use(cors())

/*
User.updateMany(
  {},
  {
    $set: {
      isplaying: "no",
    
    },
  },
  { multi: true },
  function (err, data) {
    console.log("User Updated")
  }
);

*/

Table.updateMany(
  {gameType : 12 },
  {$set: {

      timer : 16,
      }, },  function (err, data) {});


      Table.updateMany(
        {gameType : 13 },
        {$set: {
      
            timer : 16,
            }, },  function (err, data) {});


// Table.updateMany(
//   {gameType : 12 , maxPlayers  : 2},
//   {$set: {
//       playersLeft: 0,
//       amount: 0,
//       slotUsed: 0,
//       slotUsedArray: [0, 2],
//       gameStarted: false,
//       gameInit : false,
//       players: {},}, },  function (err, data) {});


Sentry.init({
  dsn: "",

  // We recommend adjusting this value in production, or using tracesSampler
  // for finer control
  environment: "development",
  tracesSampleRate: 1.0,
  maxBreadcrumbs: 1000,
  debug: true,
  integrations: [
    // enable HTTP calls tracing
    new Sentry.Integrations.Http({ tracing: true }),
  ],
  tracesSampleRate: 1.0,

});




app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
app.use(function onError(err, req, res, next) {
    res.statusCode = 500;
    res.end(res.sentry + "");
});



app.get("/health", function (req, res) {
  res.send('TP DEVELOPMENT ' + db_config.PORT_LUDO);
});

const server = http.createServer(options,app).listen(db_config.PORT_LUDO);

code.init(server);	

console.log("ludo app.js connected.....");


