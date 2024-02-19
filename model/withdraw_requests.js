const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let withdrawRequestSchema = new Schema({
    userId: { type: Schema.ObjectId, ref: 'users' },
    amount: { type: String },
    mobile : { type : String},
    ac_no: { type: String },
    ac_name: { type: String },
    ac_ifsc: { type: String },
    ac_upi: { type: String },
    status: { type: Number },
    req_by: { type: String },
    createdAt: { type: 'date' },
    updatedAt: { type: 'date' }
});

withdrawRequestSchema.pre('save', function(next) {
    var currentDate = new Date();

    this.updatedAt = currentDate;

    if (!this.createdAt)
        this.createdAt = currentDate;

    next();
});

const withdraw_requests = mongoose.model('withdraw_requests', withdrawRequestSchema);

module.exports = withdraw_requests;