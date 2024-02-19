const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const GiftSchema = new Schema(
    {
        name: { type: String },
        price: { type: Number },
        pictureUrl: { type: String, default: null },
        mp3Url: { type: String, default: null },
        display_name: { type: String }
    },
    {
        timestamps: true
    });

const Gift = mongoose.model('gift', GiftSchema);

module.exports = Gift;