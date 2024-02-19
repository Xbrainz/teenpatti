/**
 * User.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */
// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var coinSchema = new Schema({
    userId: { type: Schema.ObjectId },
    coins: { type: Number },
    createdAt: { type: 'date' },
    updatedAt: { type: 'date' },
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

var Coins = mongoose.model('po_coins', coinSchema);

// make this available to our users in our Node applications
module.exports = Coins;