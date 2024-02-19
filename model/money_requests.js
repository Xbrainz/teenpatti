const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let GameSchema = new Schema({

    pay_amount: { type: String },
    bonus_amount : { type : String},
    user_id: { type: String },
    mobile_no: { type: String },
    app_name: { type: String },
    user_name: { type: String },
    display_name: { type: String },
    status : { type: String },
    customer_id : { type: String },
    pay_response : { type: String },
    createdAt: { type: 'date' },
    updatedAt: { type: 'date' },
});

//  on every save, add the date
GameSchema.pre('save', function(next) {
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

const Game = mongoose.model('money_requests', GameSchema);

module.exports = Game;