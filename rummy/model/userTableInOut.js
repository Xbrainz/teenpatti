const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let UserTableInOutSchema = new Schema({
    userId: { type: String },
	tableId: { type: String },
    in: { type: 'date' },
    out: { type: 'date' }
});

const UserTableInOut = mongoose.model('rm_userTableInOut', UserTableInOutSchema);

module.exports = UserTableInOut;