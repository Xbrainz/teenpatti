const mongoose = require('mongoose');

// grab the things we need
const cardSchema = new mongoose.Schema({
    // cardId : { type : String, default : '' },
    // rank : { type : Number },
    // suit : { type : String },
    tableId: { type: Schema.ObjectId, ref: 'rm_tables' },
    info: {},
    joker: {},
    jokers: [],
    createdAt: { type: 'date' },
    updatedAt: { type: 'date' },
});

// On every save add the date
cardSchema.pre('save', function(next){
    // get the current date
    var currentDate = new Date();

    // change the updatedAt field 
    this.updatedAt = currentDate;

    // if createdAt doesn't exist, add to that field
    if(!this.createdAt) this.createdAt = currentDate;
    next();
});

// making model of that schema
const Card = mongoose.model('cards', cardSchema);

module.exports = Card;