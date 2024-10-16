const Cart = require('./cart-config');
// const Product = require('../models/product-model');
// const User = require('../models/user-model');

// Function that checks whether the user is logged in or not
const authCheck = (req, res, next) => {

    if(!req.user){
        // If the user is not logged in
        res.redirect("/auth/login");

    }else{
        // If the user is logged in
        next();
    }
}

//function for authorizing based on role
const authRole = (role) => {
    return (req, res, next) => {
        if (req.user.role !== role) {
            res.status(401)
            res.redirect('back'),
            req.flash('messagereview', 'You\'re not authorized to do this.') //doesn't work
        }
        next()
    }
}

module.exports = {authCheck, authRole};
