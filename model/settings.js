
const mongoose = require('mongoose');

const { Schema } = mongoose;

const settingsSchema = new Schema(
    {
        title: { type: 'string', default:'' },
        type: { type: 'string', default: '' },
        amount: { type: Number, default: 0 },
        values: []
    },
    { timestamps: true },
);

settingsSchema.pre('save', function (next) {
    const currentDate = new Date();
    this.updatedAt = currentDate;
    if (!this.createdAt) this.createdAt = currentDate;
    next();
});
const Settings = mongoose.model('settings', settingsSchema);

module.exports = Settings;
