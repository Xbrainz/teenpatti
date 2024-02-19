
const mongoose = require('mongoose');

const { Schema } = mongoose;

const announcementSchema = new Schema(
    {
        title: { type: 'string', default:'' },
        descr: { type: 'string', default: '' },
        image: { type: 'string', default: '' },
        status: { type: Number },
    },
    { timestamps: true },
);

//  on every save, add the date
announcementSchema.pre('save', function (next) {
    // get the current date
    const currentDate = new Date();
    // this.role = parseInt(this.role);

    // change the updated_at field to current date
    this.updatedAt = currentDate;

    // if created_at doesn't exist, add to that field
    if (!this.createdAt) this.createdAt = currentDate;

    next();
});
// announcementSchema.plugin(autoIncrement.plugin, 'package');

const Package = mongoose.model('announcements', announcementSchema);

// make this available to our users in our Node applications
module.exports = Package;
