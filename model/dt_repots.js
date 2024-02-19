const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let TableSchema = new Schema({
	name: { type: 'string' },
	players: {},
	maxPlayers: { type: Number, default: 9 },
	slotUsed: Number,
	slotUsedArray: [],
	boot: Number,
	lastBet: Number,
	lastBlind: Boolean,
	maxBet: Number,
	potLimit: Number,
	type: { type: Number, default: 0 },
	gameType: { type: Number, default: 0 },
	playersLeft: { type: Number, default: 0 },
	amount: { type: Number, default: 0 },
	showAmount: { type: Boolean, default: true },
	joker: {},
	gameStarted: { type: Boolean, default: false },
	isShowAvailable: { type: Boolean, default: true },
	cardSet: { closed: { type: Boolean, default: true } },
	cardinfoId: { type: Schema.ObjectId, ref: 'cardinfos' },
	lastGameId: { type: Schema.ObjectId, ref: 'games' },
	createdAt: { type: 'date' },
	updatedAt: { type: 'date' },
	type: { type: String, default: '' },
	color: { type: String, default: '' },
	color_code: { type: String, default: '' },
	tableSubType: { type: String, default: '' },
	password: { type: String, default: '' },
	tableidusername: { type: String, default: '' },
	commission: { type: Number, default: 0 },
	betRoundCompleted: { type: Number, default: 0 },
	turnTime: { type: Number, default: 0 },
	minChip: {type: Number, default:0},
	maxChip: { type: Number, default: 999999999999999 },
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

let Table = mongoose.model('tables', TableSchema);

module.exports = Table;
