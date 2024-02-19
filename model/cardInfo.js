const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let CardSchema = new Schema({
    tableId: { type: Schema.ObjectId, ref: 'tables' },
    info: {},
    joker: {},
    jokers: [],
    createdAt: { type: 'date' },
    updatedAt: { type: 'date' },
});

//  on every save, add the date
CardSchema.pre('save', function(next) {
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

const CardInfo = mongoose.model('cardinfos', CardSchema);

module.exports = CardInfo;