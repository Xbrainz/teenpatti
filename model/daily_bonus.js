
let mongoose = require('mongoose');
let Schema = mongoose.Schema;
let _ = require('lodash');


let tableSchema = new Schema({
	amount: Number,
	day: Number,
	createdAt: { type: 'date' },
	updatedAt: { type: 'date' },
}, {
	timestamps: true
});



let DailyBonus = mongoose.model('daily_bonus',tableSchema);

module.exports = DailyBonus;
