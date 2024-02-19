const mongoose = require('mongoose');

// grab the things we need
const scoreBoardSchema = new mongoose.Schema({
    playerId : { type : String },
    gamesWon : { type : Number },
    gamesLost : { type : Number },
    gamesPacked : { type : Number },
    gamesDropped : { type : Number },
    totalGames : { type : Number },
    lastGameDate : { type : Date }
});

// On every save add the date
scoreBoardSchema.pre('save', function(next){
    // get the current date
    var currentDate = new Date();

    // change the updatedAt field 
    this.updatedAt = currentDate;

    // if createdAt doesn't exist, add to that field
    if(!this.createdAt) this.createdAt = currentDate;
    next();
});

// making model of that schema
const ScoreBoard = mongoose.model('rm_scoreBoards', scoreBoardSchema);

module.exports = ScoreBoard;