const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let TableSchema = new Schema({
	name: { type: 'string' },
	players: {},
	
	playerstotal: { type: Number, default: 0 },
	amount: { type: Number, default: 0 },
	showAmount: { type: Boolean, default: true },
	
	gameStarted: { type: Boolean, default: false },
	timer : { type: Number, default: 0 },
	cardSet: { closed: { type: Boolean, default: true } },
	cardinfo: [],
	lastGameId: { type: Schema.ObjectId, ref: 'games' },
	createdAt: { type: 'date' },
	updatedAt: { type: 'date' },
	type: { type: String, default: '' },
	color: { type: String, default: '' },
	color_code: { type: String, default: '' },
	dt_dragon: { type: 'number', default: 0 },
	dt_tie: { type: 'number', default: 0 },
	dt_tiger: { type: 'number', default: 0 },

	dt_dragon_amount: { type: 'number', default: 0 },
	dt_tie_amount: { type: 'number', default: 0 },
	dt_tiger_amount: { type: 'number', default: 0 },


}, {
	timestamps: true
});

TableSchema.statics.gameStarted = false;

//  on every save, add the date
TableSchema.pre('save', function (next) {
// get the current date
	let currentDate = new Date();
	this.role = parseInt(this.role);

	// change the updated_at field to current dat
	this.updatedAt = currentDate;

	// if created_at doesn't exist, add to that field
	if (!this.createdAt) this.createdAt = currentDate;

	next();
});

let Table = mongoose.model('dt_tables', TableSchema);

module.exports = Table;
