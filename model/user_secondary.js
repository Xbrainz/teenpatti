const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let db_config = require("../config/db_uri");
var conn_secondary = mongoose.createConnection(db_config.db_read);

const Status = require("../constant/status");

let UserSchema = new Schema({
	userName: { type: 'string', required: true, unique: true },
	clientId: { type: 'string', default: '' },
	profilePic: { type: 'string', default: '' },
	lastBet: { type: 'string', default: '' },
	lastAction: { type: 'string', default: '' },
	chips: { type: 'number', default: 10000 },
	turn: { type: 'boolean', default: false },
	winner: { type: 'boolean', default: false },
	show: { type: 'boolean', default: false },
	active: { type: 'boolean', default: true },
	deal: { type: 'boolean', default: false },
	isAdmin: { type: 'boolean', default: false },
	packed: { type: 'boolean', default: false },
	isSideShowAvailable: { type: 'boolean', default: false },
	tableId: { type: Schema.ObjectId, ref: 'tables' },
	lasttableId : { type: 'string', default: '' },
	cardSet: { closed: { type: 'boolean', default: true } },
	type: { type: 'string', default: '' },
	mobile: { type: 'string', default: '' },
	password: { type: 'string' },
	displayName: { type: 'string', default: '' },
	accountType: { type: 'string', default: '' },
	role: { type: 'string', default: 'user' },
	deviceId: { type: 'string', default: '' },
	agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
	distributorId: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
	commission: {type: Number},
	clientIp: { type: 'string', default: '' },
	Decrole: { type: 'string', default: '' },
	operatorId: { type: 'string', default: '' },
	deviceType: { type: 'string', default: '' },
	status: { type: Number, default: Status.ACTIVE},
	deck_betLock : { type: 'string', default: '' },
	deck_isActive : { type: 'string', default: '' },
	isplaying : { type: 'string', default: 'no' },
	forcedisconnect :  {type: 'boolean', default: false },
	jwtToken: { type: 'string', default: '' },
	
},
	{ timestamps: true });

UserSchema.pre('save', function (next) {
	var currentDate = new Date();

	this.updatedAt = currentDate;

	if (!this.createdAt) this.createdAt = currentDate;

	next();
});

let User = conn_secondary.model('user', UserSchema);

module.exports = User;
