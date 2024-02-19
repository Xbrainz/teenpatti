const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let UserTableInOutSchema = new Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
	tableId: { type: mongoose.Schema.Types.ObjectId, ref: 'table' },
    in: { type: 'date' },
    out: { type: 'date' }
});

const UserTableInOut = mongoose.model('userTableInOut', UserTableInOutSchema);

module.exports = UserTableInOut;