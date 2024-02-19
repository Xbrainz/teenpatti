const express = require('express');
const app = express();
const Sentry = require('@sentry/node');
const SentryTracing = require("@sentry/tracing");
const path = require("path");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const logger = require("tracer").colorConsole();
const cors = require("cors");
const dotEnv = require("dotenv");

dotEnv.config();
require("./config/db");
// global.CronJob = require("./script/cron");
const errorHandler = require("./config/error-handler");


const routes = require("./routes/index");
const user = require("./routes/user");
const table = require("./routes/table");
const coin = require("./routes/coin");
const transaction = require("./routes/transaction");
const distributor = require("./routes/distributor");
const agent = require("./routes/agent");
const startup = require("./routes/startup");
const gameMenu = require("./routes/gameMenu");
const gameplay = require("./routes/gameplay");
const gifts = require("./routes/gift");
const reports = require("./routes/reports");
const dashboard = require("./routes/dashboard");
const jackpot = require("./routes/jackpot");
const Bot_Amounts = require("./routes/bot_amounts");
const gamemaster = require("./routes/gamemaster");
const Table = require("./model/table");
let Bot_Details = require('./model/bot_amounts');
const User = require("./model/user");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

const cron = require('node-cron');
const Gift = require("./model/gift");

// cron.schedule('15 30 * * *',async () => {
//   // Your task to be executed goes here
//   console.log('Cron job is running at 11 PM!');
//   const data = {
//     name: "11 pm",
  
//   };

 
//     const newGift = new Gift(data);
//     const addGift = await newGift.save();

// });

// cron.schedule('*/10 * * * * *', async() => {

//   console.log('Cron job is running at 11 PM!');
//   const data = {
//     name: "every hoursss",
  
//   };

 
//     const newGift = new Gift(data);
//     const addGift = await newGift.save();
// });

;

cron.schedule('0 */30 * * * *', async() => {

  console.log('Cron job is running at 11 PM!');
  const data = {
    name: "every30 min : "+ new Date(),
  
  };

 
    const newGift = new Gift(data);
    const addGift = await newGift.save();

    IsStopComputer();


});

// cron.schedule('0 0 */1 * * *', async() => {

//   console.log('Cron job is running at 11 PM!');
//   const data = {
//     name: "every 1 hoursss",
  
//   };

 
//     const newGift = new Gift(data);
//     const addGift = await newGift.save();

//     IsStopComputer();


// });






cron.schedule('00 30 1 * * *', async() => {
  // This function will be executed at 6 am
  console.log('Running cron job at 6 am');
  const data = {
    
    name: "at 1 30 INR  : "+ new Date(),
  
  };
    const newGift = new Gift(data);
    const addGift = await newGift.save();

    resetAllComputerPlayers();
});





Sentry.init({
    dsn: "",
  
    // We recommend adjusting this value in production, or using tracesSampler
    // for finer control
    tracesSampleRate: 1.0,
    environment: "development",
  });
  

  
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.errorHandler());
  app.use(function onError(err, req, res, next) {
      res.statusCode = 500;
      res.end(res.sentry + "");
  });
  process.on('unhandledRejection', (reason, p) => {
    console.error(reason, 'Unhandled Rejection at Promise', p);
  }).on('uncaughtException', err => {
    console.error(err, 'Uncaught Exception thrown');
    process.exit(1);
  });
  

  



// allow cors requests from any origin and with credentials
// app.use(
//   cors({
//     origin: (origin, callback) => callback(null, true),
//     credentials: true,
//   })
// );
app.use(cors());

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

app.use(cookieParser());
app.use("/public", express.static(path.join(__dirname, "public")));

app.use("/", routes);
app.use("/api/startup", startup);
app.use("/api/user", user);
app.use("/api/table", table);
app.use("/api/coin", coin);
app.use("/api/user", transaction);
app.use("/api/gameMenu", gameMenu);
app.use("/api/gameplay", gameplay);
app.use("/api/gift", gifts);
app.use("/api/distributor", distributor);
app.use("/api/agent", agent);
app.use("/api/report", reports);
app.use("/api/dashboard", dashboard);
app.use("/api/jackpot", jackpot);
app.use("/api/bot_amounts", Bot_Amounts);

app.use("/api/gamemaster", gamemaster);

//resetAllComputerPlayers();
/*
Table.updateMany(
  {},
  {
    $set: {
      playersLeft: 0,
      amount: 0,
      slotUsed: 0,
      slotUsedArray: [1, 2, 3, 4, 5],
      gameStarted: false,
      players: null,
    },
  },
  { multi: true },
  function (err, data) {
    logger.info("Table data updated sccessfully")
  }
);
*/
// Set the MIME type explicitly

express.static.mime.define({'application/wasm': ['wasm']});

app.use(errorHandler);

app.set("port", process.env.PORT || 5051);

app.use((req, res) => {
  res.writeHead(200);
  res.end("hello world\n");
});

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "*");
    next();
});

app.get("/health", function (req, res) {
    res.send('healthy');
});

app.listen(5051);

module.exports = app;	

function randomIntFromInterval(min, max) { // min and max included 
  return Math.floor(Math.random() * (max - min + 1) + min)
}

async function resetAllComputerPlayers() {
	
 await Bot_Details.find();





 
 let myTable1 = await User.find({
  isComputer : "yes"
});
console.log("start update chips : " , myTable1);





for (let user in myTable1) {

  const chipssforuser = randomIntFromInterval(5000, 9999);
  console.log("update chips : ", chipssforuser + "  "+ user);

  await User.update({
		_id : myTable1[user]._id
	}, {
		$set: {
			chips: chipssforuser,
        originalchips : chipssforuser
		}
	});




}

console.log("end update chips : ");

}


//IsStopComputer();
async function IsStopComputer() {

  let Bot_Detailsssss =  await Bot_Details.find();


  for(let positionn in Bot_Detailsssss)
  {

    console.log("Bot detailss " , Bot_Detailsssss[positionn]);
    if(Bot_Detailsssss[positionn].onoff == "on")
    {

      console.log("Bot detailss  onnnn" );
          let tablesss = await Table.find({
            boot: Bot_Detailsssss[positionn].table_boot
          });

          let totalamount=0, totalPlayers = 0;
          for(let table_position in tablesss)
          {
            console.log("USERNAME : ","computer_"+tablesss[table_position]._id);
                let userssss = await User.findOne({
                  userName: "computer_"+tablesss[table_position]._id
                });
                console.log("usesssss : ", userssss);

                if(userssss!= null || userssss != undefined)
                {
                    totalPlayers += userssss.originalchips;
                    totalamount += userssss.chips;
                }
          }


          console.log("taalplayers : ", totalPlayers , " totalamount : ", totalamount);

          let totaldiff = totalamount - totalPlayers;

          console.log("total diff  ", totaldiff);
          if(totaldiff > Bot_Detailsssss[positionn].winningprice )
          {

            console.log("offfffffffff");
            Bot_Details.update(
              { _id :Bot_Detailsssss[positionn]._id },
              {
                $set: {
                  onoff: "off",
                
                },
              },
              { multi: true },
              function (err, data) {
                logger.info("bot data updated sccessfully")
              }
            );
          
          }
          



      
    }

   
  }


  




}