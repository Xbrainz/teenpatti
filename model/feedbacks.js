const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let withdrawRequestSchema = new Schema({
    userId: { type: Schema.ObjectId, ref: 'users' },
	userName: { type: String },
    message: { type: String },
  
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

const withdraw_requests = mongoose.model('feedbacks', withdrawRequestSchema);

module.exports = withdraw_requests;