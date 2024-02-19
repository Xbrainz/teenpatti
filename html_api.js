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
const gamemaster = require("./routes/gamemaster");
const Table = require("./model/table");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

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
app.use("/api/gamemaster", gamemaster);

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

app.set("port", process.env.PORT || 9090);


app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "*");
    next();
});

app.get("/health", function (req, res) {
    res.send('healthy 9090');
});

app.use((req, res) => {
  res.writeHead(200);
  res.end("hello world\n");
});

app.listen(9090);

module.exports = app;	
