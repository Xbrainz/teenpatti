/**
 * User.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */
// grab the things we need
const mongoose = require('mongoose');

const { Schema } = mongoose;

const packageSchema = new Schema(
    {
        coin: { type: 'string', required: true },
        extra: { type: 'string', default: '' },
        price: { type: 'string', default: '' },
        status: { type: Number },
    },
    { timestamps: true },
);

//  on every save, add the date
packageSchema.pre('save', function (next) {
    // get the current date
    const currentDate = new Date();
    // this.role = parseInt(this.role);

    // change the updated_at field to current date
    this.updatedAt = currentDate;

    // if created_at doesn't exist, add to that field
    if (!this.createdAt) this.createdAt = currentDate;

    next();
});
// packageSchema.plugin(autoIncrement.plugin, 'package');

const Package = mongoose.model('package', packageSchema);

// make this available to our users in our Node applications
module.exports = Package;
