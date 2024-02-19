const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BotSchema = new Schema(
    {
        table_boot: { type: 'string', default: ''},
        onoff: { type: 'string', default: '' },
        winningprice: { type: 'string', default: ''},
        createdAt: { type: 'date' },
        updatedAt: { type: 'date' },
       
    },
    {
        timestamps: true
    });


    BotSchema.pre('save', function(next) {
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

const Game = mongoose.model('bot_amounts', BotSchema);

module.exports = Game;

