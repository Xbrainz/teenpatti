const mongoose = require("mongoose");
let db_config = require("./db_uri");


mongoose.connect(db_config.db, { })
  .then((e) => {
    console.log("Database connect successfully with primary.");
  })
  .catch((e) => {
    console.error("::::: Failed to connect Database. :::::",e);
  });
mongoose.connection.useDb('Rummy');
const db = mongoose.connection;


return db;












/* BACKUP BEFORE Primary Secondary database*/
// const mongoose = require("mongoose");

// mongoose
// //  .connect("mongodb://localhost:27017/myFirstDatabase", {
//     // mongodb+srv://username:password@HOSTNAME.com/DATABASE
  
//     // .connect("mongodb+srv://cgservice:tu6mz8hacfi4xufv@slsfree.o4hyn.mongodb.net/clubgames?retryWrites=true&w=majority", {

//     // Testing Database clubgames
//     // .connect("mongodb+srv://cgservice:tu6mz8hacfi4xufv@slsfree.o4hyn.mongodb.net/clubgames?authSource=admin&w=majority&readPreference=primary&retryWrites=true&ssl=true", {

//     // Live Db
//     .connect("mongodb+srv://engineuser:59FWRUSFXQKR@cg.o8rz6.mongodb.net/cgengine", {

    

//     // useCreateIndex: true,
//     // useNewUrlParser: true,
//     // useUnifiedTopology: true,
//     // useFindAndModify: false,
//   })
//   .then((e) => {
//     console.log("Database connect successfully.");
//   })
//   .catch((e) => {
//     console.error("::::: Failed to connect Database. :::::",e);
//   });
// //   mongoose.connection.useDb('myFirstDatabase');
//   mongoose.connection.useDb('clubgames');
// const db = mongoose.connection;

// return db;
