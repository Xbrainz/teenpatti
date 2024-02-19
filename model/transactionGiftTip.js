const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let TransactionGiftTipSchema = new Schema({
    senderId: { type: Schema.ObjectId },
    receiverId: { type: Schema.ObjectId },
    transType: { type: String, default: "" },
    coins: { type: Number },
    tableId: { type: Schema.ObjectId },
    createdAt: { type: 'date' },
    updatedAt: { type: 'date' },
    giftName: { type: String }
});

//  on every save, add the date
TransactionGiftTipSchema.pre('save', function(next) {
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

const TransactionGiftTip = mongoose.model('transactionGiftTip', TransactionGiftTipSchema);

module.exports = TransactionGiftTip;