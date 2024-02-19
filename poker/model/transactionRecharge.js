const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let TransactionRechargeSchema = new Schema({
    senderId: { type: Schema.ObjectId },
    receiverId: { type: Schema.ObjectId },
    transType: { type: String, default: "" },
    coins: { type: Number },
    createdAt: { type: 'date' },
    updatedAt: { type: 'date' },
    remark: { type: String }
});

//  on every save, add the date
TransactionRechargeSchema.pre('save', function (next) {
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

let TransactionRecharge = mongoose.model('po_transactionRecharge', TransactionRechargeSchema);

module.exports = TransactionRecharge;