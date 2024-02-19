const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let db_config = require("../config/db_uri");
var conn = mongoose.createConnection(db_config.db);
var conn_secondary = mongoose.createConnection(db_config.db_read);

let GameSchema = new Schema({
    tableId: { type: Schema.ObjectId, ref: 'tables' },
    cardInfoId: { type: Schema.ObjectId, ref: 'cardinfos' },
    players: {},
    createdAt: { type: 'date' },
    updatedAt: { type: 'date' },
});

//  on every save, add the date
GameSchema.pre('save', function(next) {
    // get the current date
    var currentDate = new Date();
    this.role = parseInt(this.role);

    // change the updated_at field to current date
    this.updatedAt = currentDate;

    // if created_at doesn't exist, add to that field
    if (!this.createdAt)
        this.createdAt = currentDate;

    next();
});

let Game = conn_secondary.model('games', GameSchema);
// let Table = mongoose.model('tables', TableSchema);

module.exports = Game;
