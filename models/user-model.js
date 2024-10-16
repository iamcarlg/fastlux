const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ROLE = require('./user-role'); //import user roles

const userSchema = new Schema({
     
     googleId : {
          type : String,
          required : true
     },
     
     username : {
          type : String,
          required : true
     },
     
     thumbnail : {
          type : String,
          required : true
     },

     email : {
          type : String,
          required : true
     },
     
     country : {
          type : String,
          required : false,
          default: null
     },

     city : {
          type : String,
          required : false,
          default: null
     },

     address : {
          type : String,
          required : false,
          default: null
     },

     zipCode : {
          type : Number,
          required : false,
          default: null
     },

     role: {
          type: String,
          required: true,
          default: ROLE.CASUAL
      },
      products: [{
          type: Schema.Types.ObjectId,
          ref: 'Product',
      }],

      reviews: [{
          type: Schema.Types.ObjectId,
          ref: 'Review',
      }]
});

const User = mongoose.model('User', userSchema);

module.exports = User;
