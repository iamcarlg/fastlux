const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Schema for our products collection in mongodb
const productSchema = new Schema({
    name : {
        type : String,
        required : true,
        maxlength : 30
    },

    picture : {
        type : String,
        data : Buffer,
        required : true
    },

    category : {
        type : String,
        required : true,
        maxlength: 20,
        enum : ['Burger', 'Pasta', 'Pizza', 'Fries']
    },

    description : {
        type : String,
        required : true,
        maxlength: 500

    },

    variant : {
        type : String,
        maxlength: 500,
        enum : ['Small', 'Medium', 'Big']

    },

    smallPrice : {
        type : Number,
        required: true,
        
    },

    mediumPrice : {
        type : Number,
        required: true,
        
    },

    bigPrice : {
        type : Number,
        required: true,
        
    },
    price : {
        type : Number,
        required : false,
        
    },

    author: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },

    products: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
    },

    //foreign key to retrieve an array of reviews on the product
    reviews: [{
        type: Schema.Types.ObjectId,
        ref: 'Review'
    }]

}, {timestamps: true});

productSchema.index({ title: 'text', });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
