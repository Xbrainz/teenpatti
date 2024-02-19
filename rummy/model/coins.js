const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let CoinSchema = new Schema({
    userId: { type: Schema.ObjectId },
    coins: { type: Number },
    createdAt: { type: 'date' },
    updatedAt: { type: 'date' },
});

//  on every save, add the date
CoinSchema.pre('save', function(next) {
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

const Coins = mongoose.model('rm_coins', CoinSchema);

module.exports = Coins;