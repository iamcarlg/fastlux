const router = require('express').Router();
const bodyParser = require('body-parser'); //import bodyParser to call data with req.body
const moment = require('moment'); //middleware for date formatting
const nodemailer = require('nodemailer'); // Module to send emails

// THE MODELS
const ROLE = require('../models/user-role');
const Product = require('../models/product-model');
const User = require('../models/user-model');
const Order = require('../models/order-model');
const Review = require('../models/review-model');

// MIDDLEWARES AND CONFIGURATIONS
const {authCheck, authRole} = require('../config/authorization');
const {storage, upload} = require('../config/storage');
const Cart = require('../config/cart-config');
const keys = require('../config/keys');

const urlencodedParser = bodyParser.urlencoded({ extended: true }); // Parsing HTML data on the server

// Parsing data from HTML inputs
router.use(bodyParser.json());
router.use(urlencodedParser);

// ===============================   CASUAL CONNECTED USERS ===========================================

// Renders the menu list of the casual Connected user 
router.get('/', authCheck, authRole(ROLE.CASUAL), (req, res) =>{
    Product.find({}, (err, product) =>{
        if (err) {
            console.log(err);
            res.status(500).send('An error occurred', err);
        }
        else {
            res.render('manage-menu', { user:req.user,products: product, loginMsg: req.flash('loginMsg')});
        }
    });

});

// Renders the menu list of the casual Connected user 
router.get('/dashboard', authCheck, authRole(ROLE.CASUAL), (req, res) =>{
    Product.find({}, (err, product) =>{
        if (err) {
            console.log(err);
            res.status(500).send('An error occurred', err);
        }
        else {
            res.render('manage-menu', { user:req.user,products: product, loginMsg: req.flash('loginMsg')});
        }
    });

});

// renders a specific product
router.get('/products/:id', authCheck, authRole(ROLE.CASUAL), (req, res) => {
    const id = req.params.id;
    const user = req.user;

    Product.findById(id)
    .populate({
        path: 'reviews',
        populate: {
            path: 'author'
        }
    })
    .then(result => {

        res.render('manage-product-detail', {user:req.user, product:result, 
                                            reviewStatus : req.flash('reviewStatus'), 
                                            moment: moment});

    })
    .catch(err => {
        console.log(err);
        req.flash('message_notFound', 'The product cant be found, please try another product')
        res.redirect('/casual/dashboard');
    });
})

// Renders the profile of the casual Connected user 
router.get('/profile', authCheck, authRole(ROLE.CASUAL), (req, res) =>{
    res.render('manage-profile', {user:req.user, userInfoUpdated:req.flash('userInfoUpdated')});

});

// Renders the about of the casual Connected user 
router.get('/about', authCheck, authRole(ROLE.CASUAL), (req, res) =>{
    res.render('view-about', {user:req.user});

});

// Renders the contact of the casual Connected user 
router.get('/contactUs', authCheck, authRole(ROLE.CASUAL), (req, res) =>{
    res.render('view-contact', {user: req.user, qs: req.query, emailSent:req.flash('emailSent')});

});

router.post('/contactUs', authCheck, authRole(ROLE.CASUAL), urlencodedParser, (req, res) => {

    const user = req.user;

    const from = user.email;
    const name = req.body.name;
    const subject = req.body.subject;
    const to = "fastluxbrand@gmail.com";
    const message = req.body.msg;

    // Configure the nodemailer transporter using auth user and pass
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: keys.nodemailer.user,
            pass: keys.nodemailer.pass
        }
    });

    const mailConfigurations = {
        from : from,
        to : to,
        subject : subject,
        text : message + "\n\nMessage sent by " + name + "\n\nSender Email : " + from
    };

    transporter.sendMail(mailConfigurations, function (error, info) {
        if (error) throw Error(error);
        console.log('Email Sent Successfully');
        console.log(info);

        res.redirect('/casual/contactUs');
        });

    // After the email is successful, renders the contact page with success message
    req.flash('emailSent', 'Your message is sent successfully');


});

// User updates his shipping info details 
router.patch('/updateuser/:id', authCheck, authRole(ROLE.CASUAL), upload.single('picture'), async(req, res) =>{

    req.user = await User.findByIdAndUpdate(req.params.id);

    try {
        
        let user = req.user;

        user.country = req.body.country;
        user.city = req.body.city;
        user.address = req.body.address;
        user.zipCode = req.body.zipCode;

        user = await user.save();

        //redirect to show route
        req.flash('userInfoUpdated', 'The user shipping info have been updated');
        console.log("The user is updated with shipping info !");
        res.redirect('/casual/profile');

    } catch (error) {
        console.log(error);
    }
});


// Renders the menu list of the casual Connected user 
router.get('/cart', authCheck, authRole(ROLE.CASUAL), (req, res, next) =>{

    try {
        // Check if we have a cart in our session. 
        if (!req.session.cart) {

            return res.render('shopping-cart', {
                title: 'Shopping Cart',
                products: null,
                totalPrice: cart.totalPrice,
                totalQty: cart.totalQty,
                user: req.user
            });
        }
        //if we create a new one for our session
        var cart = new Cart(req.session.cart)

        // pass our shopping.cart array, totalQty,totalPrice functions.
        
        res.render('shopping-cart', {
            products: cart.generateArray(),
            totalPrice: cart.totalPrice,
            totalQty: cart.totalQty,
            title: 'Shopping Cart',
            user: req.user,
        })


    } catch (err) {

        res.render('shopping-cart', {
            products: null,
            totalPrice: 0,
            totalQty: 0,
            title: 'Shopping Cart',
            user: req.user
        })
        console.log(err);
    }

});

// Add item to cart when variant is SMALL
router.get('/cart/add/:id/small', authCheck, authRole(ROLE.CASUAL), (req, res) => {
    //Find the product id
    const productId = req.params.id;

    // Create a cart object to store item based on  user session
    try {
        const cart = new Cart(req.session.cart ? req.session.cart : {});

        // Search for item we are trying to put in our basket.
        Product.findById(productId, function (err, product) {
            if (err) {
                return res.redirect('/')
            }
            // if success product will be added to the cart,
            //fetch product from database and the id of the product

            product.price = product.smallPrice;
            product.variant = "Small";
            
            cart.add(product, product.id);

            //store in cart object in my session
            req.session.cart = cart;
            console.log(req.session.cart);
            res.redirect('back');
        })
    } catch (err) {
        console.log(err)
    }
});

// Add item to cart when variant is MEDIUM
router.get('/cart/add/:id/medium', authCheck, authRole(ROLE.CASUAL), (req, res) => {
    //Find the product id
    const productId = req.params.id;

    // Create a cart object to store item based on  user session
    try {
        const cart = new Cart(req.session.cart ? req.session.cart : {});

        // Search for item we are trying to put in our basket.
        Product.findById(productId, function (err, product) {
            if (err) {
                return res.redirect('/')
            }
            // if success product will be added to the cart,
            //fetch product from database and the id of the product

            product.price = product.mediumPrice;
            product.variant = "Medium";
            cart.add(product, productId);

            //store in cart object in my session
            req.session.cart = cart;
            console.log(req.session.cart);
            res.redirect('back');
        })
    } catch (err) {
        console.log(err)
    }
});

// Add item to cart when variant is BIG
router.get('/cart/add/:id/big', authCheck, authRole(ROLE.CASUAL), (req, res) => {
    //Find the product id
    const productId = req.params.id;

    // Create a cart object to store item based on  user session
    try {
        const cart = new Cart(req.session.cart ? req.session.cart : {});

        // Search for item we are trying to put in our basket.
        Product.findById(productId, function (err, product) {
            if (err) {
                return res.redirect('/')
            }
            // if success product will be added to the cart,
            //fetch product from database and the id of the product

            product.price = product.bigPrice;
            product.variant = "Big";

            cart.add(product, productId);
   
            //store in cart object in my session
            req.session.cart = cart;
            console.log(req.session.cart);
            res.redirect('back');
        })
    } catch (err) {
        console.log(err)
    }
});

// Route for incrementing an item in shopping cart
router.get('/cart/increase/:id', authCheck, authRole(ROLE.CASUAL), (req, res, next)=> {
    const productId = req.params.id;
    try {
        // Create a new cart and a session for it
        const cart = new Cart(req.session.cart ? req.session.cart : {});
        // Call our reduceByOne function from shopping-cart model
        cart.increaseByOne(productId);
        // save the contents of a cart 
        req.session.cart = cart;
        console.log(req.session.cart);
        res.redirect('back');
    } catch (err) {
        console.log(err)
    }
});

//Route for decreasing an item from shopping-cart 
router.get('/cart/reduce/:id', authCheck, authRole(ROLE.CASUAL), (req, res, next)=> {
    const productId = req.params.id;
    try {
        // Create a new cart and create a session for it
        const cart = new Cart(req.session.cart ? req.session.cart : {});
        // Call our reduceByOne function from shopping-cart model
        cart.reduceByOne(productId);
        //  save the contents of a cart 
        req.session.cart = cart;
        console.log(req.session.cart);
        res.redirect('back');
    } catch (err) {
        console.log(err)
    }
});

// Route for removing item from cart (Not implemented in view)
router.get('/cart/remove/:id', authCheck, authRole(ROLE.CASUAL), (req, res, next)=> {
    const productId = req.params.id;

    const cart = new Cart(req.session.cart ? req.session.cart : {});
    // Call our remove function from shopping-cart-model.
    cart.removeItem(productId);
    // save the contents of a cart 
    req.session.cart = cart;
    res.redirect('/casual/cart');
});


// Renders the order history of the casual Connected user 
router.get('/order-history', authCheck, authRole(ROLE.CASUAL), (req, res, next) =>{

    try {
        Order.find({ user: req.user }, function (err, orders) {
            if (err) {
                return res.write('Order history errors')
            }
            var cart;
            // we generate cart for order we have made
            orders.forEach(function (order) {
                cart = new Cart(order.cart);
                order.items = cart.generateArray();
            });
            res.render('order-history', { title: "My Orders", orders: orders, user: req.user});
        });
    } catch (err) {
        console.log(err)
        
    }

});

// route to post a review
router.post("/product/:id/review/post", authRole(ROLE.CASUAL), (req, res, next) => {

    const user = req.user;
    const id = req.params.id;
    const review = new Review(req.body);
    review.author = user;

    console.log(review);
    review //create a new review
        .save()
        .then(() => Product.findById(id),
            console.log(review)
        ) //find the product that is being reviewed

        .then((result) => {
            result.reviews.unshift(review); //append review details to this product, unshift puts the newest entry at the top
            req.flash('reviewStatus', 'The review has been posted'); 
            return result.save();
        })

        .then(() => res.redirect('back')) //redirect to the product
        .catch((err) => {
            res.redirect('back'),
            console.log(err);
        });

})


// ============================================================================================

module.exports = router;
