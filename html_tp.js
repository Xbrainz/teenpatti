const http = require('http');
const Sentry = require('@sentry/node');
const SentryTracing = require("@sentry/tracing");
let mongoose = require("mongoose");
const options = {
  cors: [
    "http://localhost:3000",
  

  ],
  pingInterval: 2000,
  pingTimeout: 5000,
  reconnectInterval : 5000,
 // forceNew: true
};
const User = require("./model/user");
const express = require('express');
const app = express();
const code = require("./lib/code");
const cors = require("cors");
const dotEnv = require("dotenv");
const Table = require("./model/table");
const Old_Table = require("./model/old_table");
dotEnv.config();
require("./config/db");
app.use(cors())
const cron = require("node-cron");
const path = require('path');	
// Creating a cron job which runs on every 10 second



async function checkall()
{
  
//cron.schedule("0 0 */23 * * *",async function() {
  let finalStartDate = new Date();
 console.log("cron job ..q");
  finalStartDate.setDate(finalStartDate.getDate() - 3);
  let arrtables = await Table.find({
  createdAt : { $lte: finalStartDate  } ,
  tableSubType: "private",
  });
  
  // await User.update({
  //   userName: "RDE:zzz87"
  // }, {
  //   $inc: {
  //     chips: 100
  //   }
  // });


  //foofoo();

console.log("Current date : "  ,finalStartDate );
for (let table in arrtables) {
  if (arrtables[table].players == null || Object.keys(arrtables[table].players).length ==0) {
   //  Table.deleteOne({ _id:arrtables[table]._id }, function (err, results) { });

    //  Table.updateMany(
    //   {  _id:arrtables[table]._id },
    //   { $set: {GameStatus: 0} },  function (err, data) {});

      let tablessaa = await Table.findOne({ _id: arrtables[table]._id });
 					tablessaa = JSON.parse(JSON.stringify(tablessaa));
					delete tablessaa.__v;
				
          Old_Table.create(tablessaa, function (err, table) {
					if (err) {
						console.log("error" , err);
					} else {
						Table.deleteOne({ _id:arrtables[table]._id }, function (err, results) { });
					}
					});



  }
}

//});

}


checkall();





// Table.updateMany(
//   {gameStarted: false ,gameType :{$ne : 12} , gameType : {$ne : 13}},
//   {$set: {
//       playersLeft: 0,
//       amount: 0,
//       slotUsed: 0,
//       slotUsedArray: [1, 2, 3, 4, 5],
//       gameStarted: false,
//       gameInit : false,
//       players: {},}, },  function (err, data) {});






Table.updateMany(
  { players: null, },
  { $set: {players: {},}, },  function (err, data) {});


Table.updateMany(
  { gameType: 1 },
  {
    $set: {
      playersLeft: 0,
      amount: 0,
      slotUsed: 0,
      slotUsedArray: [1, 2, 3, 4, 5],
      gameStarted: false,
      gameInit : false,
      players: {},
    },
  }, 
  //{ multi: true },
  function (err, data) {
 
  }
);



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
// app.use(express.static('public')); 	
// app.use('/images', express.static('images'));	
 	
  // const directory = path.join(__dirname, 'public/images');	
  // app.use('/images', express.static(directory));	
  var publicDir = require('path').join(__dirname,'/public'); 	
  app.use(express.static(publicDir)); 	


  process.on('unhandledRejection', (reason, p) => {
    console.error(reason, 'Unhandled Rejection at Promise', p);
  }).on('uncaughtException', err => {
    console.error(err, 'Uncaught Exception thrown');
    process.exit(1);
  });




User.updateMany(
  {},
  {
    $set: {
      isplaying: "no",
    
    },
  },
  { multi: true },
  function (err, data) {
    console.log("User Updated..2")
  }
);


app.get("/health", function (req, res) {
  res.send('healthy 9091');
});






const server = http.createServer(options,app).listen(9091);

code.init(server);	



