const http = require('http');
let db_config = require("./config/db_uri");
const options = {
  pingInterval: 2000,
  pingTimeout: 5000,
  reconnectInterval : 5000,
 // forceNew: true
};

const express = require('express');
const app = express();
const code = require("./poker/lib/code");
const cors = require("cors");
const dotEnv = require("dotenv");


dotEnv.config();
require("./config/db");
app.use(cors())



async function updatetabless()
{
// Table.updateMany(
//   {gameType :15 },
//   {$set: {
//       playersLeft: 0,
//       amount: 0,
//       slotUsed: 0,
//       slotUsedArray: [1, 2, 3, 4, 5],
//       gameStarted: false,
//       gameInit : false,
//       players: {},}, },  function (err, data) {});
}


updatetabless();
        




app.get("/health", function (req, res) {
  res.send('TP DEVELOPMENT ' + db_config.PORT_POKER);
});

const server = http.createServer(options,app).listen(db_config.PORT_POKER);

code.init(server);	

console.log("poker app.js called.....");



