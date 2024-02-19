const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let TableSchema = new Schema({
	name: { type: 'string' },
	//_ids : { type: Schema.ObjectId, ref: 'tables' },
	players: { type: Schema.Types.Mixed, default: {} },

	maxPlayers: { type: Number, default: 5 },
	slotUsed: Number,
	slotUsedArray: [],
	boot: Number,
	
	lastBet: Number,
	lastBlind: Boolean,
	maxBet: Number,
	potLimit: Number,
	type: { type: Number, default: 0 },
	gameType: { type: Number, default:0 },
	playersLeft: { type: Number, default: 0 },
	amount: { type: Number, default: 0 },
	showAmount: { type: Boolean, default: true },
	joker: {},
	gameStarted: { type: Boolean, default: false },
	gameInit: { type: Boolean, default: false },
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
	tableCode: { type: String, default: '' },
	commission: { type: Number, default: 0 },
	provider_commission: { type: Number, default: 0 },
	betRoundCompleted: { type: Number, default: 0 },
	turnTime: { type: Number, default: 0 },
	minChip: {type: Number, default:0},
	maxChip: { type: Number, default: 999999999999999 },
	image: { type: String, default: '' },
	gameCategory: { type: String, default: '' },
	gameName: { type: String, default: '' },

    GameStatus: { type: Number, default: 1 },
	jack_2to10: { type: String, default: '' },
	jack_jqk: { type: String, default: '' },
	jack_aaa: { type: String, default: '' },
	maxBlindCount : { type: Number, default: 4 },
	timer : { type: Number, default: 0 },
	createdBy: { type: String, default: '' },
	createdById: { type: Schema.ObjectId, ref: 'cardinfos' },
	dealer: { type: Number, default: 1 },
	turnplayerId: { type: String, default: '' },
	betRoundCompleted: { type: Number, default: 0 },
	__v : {type : Number, default : 0}

}, {
	timestamps: true,
	minimize: false
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

let Table = mongoose.model('old_tables', TableSchema);

module.exports = Table;
