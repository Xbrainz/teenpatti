const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let withdrawRequestSchema = new Schema({
    userId: { type: Schema.ObjectId, ref: 'users' },
    username: { type: String },
    kyctype: { type: String },
    frontback: { type: String },
    kycurl : { type : String},
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

const withdraw_requests = mongoose.model('kycs', withdrawRequestSchema);

module.exports = withdraw_requests;