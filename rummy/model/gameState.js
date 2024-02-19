const mongoose = require('mongoose');

// grab the things we need
const gameStateSchema = new mongoose.Schema({
    gameId : { type : String },
    gameJson : { turn : { type : String } },
    gameDate : { type : Date }
});

// On every save add the date
gameStateSchema.pre('save', function(next){
    // get the current date
    var currentDate = new Date();

    // change the updatedAt field 
    this.updatedAt = currentDate;

    // if createdAt doesn't exist, add to that field
    if(!this.createdAt) this.createdAt = currentDate;
    next();
});

// making model of that schema
const GameState = mongoose.model('rm_gameState', gameStateSchema);

module.exports = GameState;