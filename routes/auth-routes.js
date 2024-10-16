//import express and set port
const router = require('express').Router();
const passport = require('passport');
const cookieSession = require('cookie-session');
const session = require('express-session');
const User = require('../models/user-model');
const Cart = require('../config/cart-config');

// auth login
router.get('/login', (req, res)=> {

    //   cart.removeArray();
    req.session.cart = null;
    res.render('login');

})

// auth logout
router.get('/logout', (req, res) =>{

    try{
        // Clear the cookie of the connected user
        res.clearCookie('connect.sid');
        
        router.use( session({
            name : "cookie",
            secret :"secret111",
            resave : true,
            saveUninitialized: true,
            cookie: { secure: false, maxAge: 14400000 },
          })
          );

          req.logOut();
          
          
          // Destroy session
          req.session.destroy;
        
          req.flash("logoutMsg", "You are successfully logged out !");
        
          //   Redirect to public home page
          res.redirect('/');

        console.log("The user is logged out from the session !");

    }catch(err){
        res.redirect("/");
        console.log("The user failed to log out !\n Here is the error : ", err);

    }


})

// auth with google
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}))

// callback route for google after successful login
router.get('/google/redirect', passport.authenticate('google'), (req, res) => {
    
    // res.send(req.user);
    req.flash('loginMsg', 'You are successfully logged in !');

    // Check Admin or casual routes
    if(req.user.role === "admin"){
        res.redirect('/admin/dashboard');

    }else{
        res.redirect('/casual/dashboard');
    }
    
})

module.exports = router;


