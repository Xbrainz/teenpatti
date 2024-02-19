const mongoose = require('mongoose');
const Schema = mongoose.Schema;

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

const Game = mongoose.model('games', GameSchema);

module.exports = Game;