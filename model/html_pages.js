// html_pages.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let html_pagesSchema = new Schema({
    page_title: { type: String },
    page_descr : { type : String},
    status: { type: Number },
    createdAt: { type: 'date' },
    updatedAt: { type: 'date' }
});

html_pagesSchema.pre('save', function(next) {
    var currentDate = new Date();

    this.updatedAt = currentDate;

    if (!this.createdAt)
        this.createdAt = currentDate;

    next();
});

const html_pages = mongoose.model('html_pages', html_pagesSchema);

module.exports = html_pages;