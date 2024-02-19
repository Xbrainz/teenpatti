const http = require('http');
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
  res.send('rummy healthy');
});

const server = http.createServer(options,app).listen(5054);

code.init(server);	

console.log("poker connected.....");



