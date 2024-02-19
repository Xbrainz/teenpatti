let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let TransactionChalWinSchema = new Schema({
    userId: { type: Schema.ObjectId },
    transType: { type: String, default: "" },
    coins: { type: Number },
    cardSet: { type: Array },
    tableId: { type: Schema.ObjectId },
    gameId: { type: Schema.ObjectId },
	requestId: { type: 'string', default: '' },
    createdAt: { type: 'date' },
    updatedAt: { type: 'date' },
});

//  on every save, add the date
TransactionChalWinSchema.pre('save', function(next) {
    // get the current date
    let currentDate = new Date();
    this.role = parseInt(this.role);

    // change the updated_at field to current date
    this.updatedAt = currentDate;

    // if created_at doesn't exist, add to that field
    if (!this.createdAt)
        this.createdAt = currentDate;

    next();
});

let TransactionChalWin = mongoose.model('transactionChalWin', TransactionChalWinSchema);

module.exports = TransactionChalWin;