
let mongoose = require('mongoose');
let Schema = mongoose.Schema;
let _ = require('lodash');


let tableSchema = new Schema({
	userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
	seq: Number,
	chips: Number,
	createdAt: { type: 'date' },
	updatedAt: { type: 'date' },
}, {
	timestamps: true
});



let Rankings = mongoose.model('rankings',tableSchema);

module.exports = Rankings;
