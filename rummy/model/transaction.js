var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var coinSchema = new Schema({
    userId: { type: Schema.ObjectId },
    senderId: { type: Schema.ObjectId },
    receiverId: { type: Schema.ObjectId },
    tableId:{ type: Schema.ObjectId},
    trans_type: { type: String, default: "" },
    gameId: { type: Schema.ObjectId },
    coins: { type: Number },
    reason: { type: String, default: "rm_game" },
    createdAt: { type: 'date' },
    updatedAt: { type: 'date' },
    giftName: { type: String },
    userName: { type: String }
});

//  on every save, add the date
coinSchema.pre('save', function(next) {
    // get the current date
    var currentDate = new Date();
    this.role = parseInt(this.role);

    // change the updated_at field to current date
    this.updatedAt = currentDate;

    // if created_at doesn't exist, add to that field
    if (!this.createdAt)
        this.createdAt = currentDate;

    next();
});
// userSchema.plugin(autoIncrement.plugin, 'user');

var Transaction = mongoose.model('rm_transaction', coinSchema);

// make this available to our users in our Node applications
module.exports = Transaction;