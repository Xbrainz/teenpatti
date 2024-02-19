const mongoose = require('mongoose');
const { object } = require('underscore');

// grab the things we need
const tableSchema = new mongoose.Schema({
	players: {},
    maxPlayers: { type: Number, default: 2 },
	slotUsed: Number,
    slotUsedArray: [],
    boot : { type : Number, required : true },
    tableAmount : { type : Number, default : 0 },
    commission : { type : Number, default : 0 },
    gameType: { type: Number, default: 1 },
    tableSubType: { type: String, default: 'public' },
	playersLeft: { type: Number, default: 0 },
    pointValue : { type: Number, default: 0.5 },
    points : { type : Number , default : 80 },
    turn : { type: Boolean, default: false },
    cardInfoId: { type: String },
	cardSet: { closed: { type: Boolean, default: true } },
    turnTime: { type: Number, default: 0 },
    bonusTime: { type: Number, default: 0 },
	jokers: {},
    gameStarted: { type: Boolean, default: false },
    cardIdDiscarded : { type : Number, default : 0 },
	createdById: { type: Schema.ObjectId, ref: 'users' },
    betRoundCompleted : { Number }
});

// On every save add the date
tableSchema.pre('save', function(next){
    // get the current date
    var currentDate = new Date();

    // change the updatedAt field 
    this.updatedAt = currentDate;

    // if createdAt doesn't exist, add to that field
    if(!this.createdAt) this.createdAt = currentDate;
    next();
});

// making model of that schema
const Table = mongoose.model('rm_tables', tableSchema);

module.exports = Table;