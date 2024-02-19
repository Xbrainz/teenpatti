const mongoose = require('mongoose');
const { Schema } = mongoose;

const jackpotSchema = new Schema(
    {
        priority: { type: 'string', required: true, unique: true },
        amount: { type: 'string', default: '' },
    }
);

const Jackpot = mongoose.model('jackpot_tables', jackpotSchema);

module.exports = Jackpot;
