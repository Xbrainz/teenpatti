
let mongoose = require('mongoose');
let Schema = mongoose.Schema;
let _ = require('lodash');

let cardComparer = require('../service/variations/cardComparer');

let tableSchema = new Schema({
	name: { type: 'string' },
	players: { type: Schema.Types.Mixed, default: {} },
	maxPlayers: Number,
	slotUsed: Number,
	slotUsedArray: [],
	boot: Number,
	lastBet: Number,
	lastBlind: Boolean,
	maxBet: Number,
	potLimit: Number,
	tableCode: { type: String, default: '' },
	type: { type: String, default: '' },
	gameType: { type: Number, default: 0 },
	playersLeft: { type: Number, default: 0 },
	amount: { type: Number, default: 0 },
	showAmount: { type: Boolean, default: true },
	joker: {},
	gameStarted: { type: Boolean, default: false },
	isShowAvailable: { type: Boolean, default: true },
	cardSet: { closed: { type: Boolean, default: true } },
	cardinfoId: { type: Schema.ObjectId, ref: 'po_cardinfos' },
	lastGameId: { type: Schema.ObjectId, ref: 'po_games' },
	createdAt: { type: 'date' },
	updatedAt: { type: 'date' },
	turnTime: { type: Number, default: 0 },
	color: { type: String, default: '' },
	dealer: { type: Number, default: 1 },
	color_code: { type: String, default: '' },
	tableSubType: { type: String, default: '' },
	password: { type: String, default: '' },
	commission: { type: Number, default: 0 },
	betRoundCompleted: { type: Number, default: 0 },
	turnplayerId: { type: String, default: '' },
	GameStatus: { type: Number, default: 1 },
	timer : { type: Number, default: 0 },
}, {
	timestamps: true,
	minimize: false
});

tableSchema.statics.gameStarted = false;


//  on every save, add the date
tableSchema.pre('save', function (next) {
	// get the current date
	let currentDate = new Date();
	this.role = parseInt(this.role);

	// change the updated_at field to current dat
	this.updatedAt = currentDate;

	// if created_at doesn't exist, add to that field
	if (!this.createdAt) this.createdAt = currentDate;

	next();
});

let Table = mongoose.model('po_tables', tableSchema);

module.exports = Table;
