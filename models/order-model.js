const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//schema for our order collection in mongodb
const orderSchema = new Schema({
    orderID: {
        type: Number,
        required: false,
        maxlength: 10,
    },

    // Stores our cart json
    cart: {
        type: Object,
        required: true
    },
    //Address of the purchaser
    country: {
        type: String,
        required: true,
        maxlength: 60,
    },
    city: {
        type: String,
        required: true,
        maxlength: 60,
    },
    address: {
        type: String,
        required: true,
        maxlength: 60,
    },

    email: {
        type: String,
        required: true,
        maxlength: 60,
    },
    zipcode: {
        type: Number,
        required: true,
        maxlength: 10,
    },

    status : {
        type: String,
        required: true,
        maxlength: 20,
        default : "not delivered"
    },

    product: {
        type: Schema.Types.ObjectId,
        ref: 'Product'
    },

    date: {
        type: String,
        required: false,
        default: Date.now
    },
    //Refers to the user who made the order
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;