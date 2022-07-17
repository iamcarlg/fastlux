const router = require('express').Router();
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const Product = require('../models/product-model');
const User = require('../models/user-model');
const Order = require('../models/order-model');
const Review = require('../models/review-model');
const Cart = require('../config/cart-config');

const ROLE = require('../models/user-role');
const {authCheck, authRole} = require('../config/authorization');
const {storage, upload} = require('../config/storage');


 // ===============================   ADMIN CONNECTED USERS ===============================================================

// Renders the dashboard of the connected user 
router.get('/', authCheck, authRole(ROLE.ADMIN), (req, res) =>{
    try {
        Order.find({}, function (err, orders) {
            if (err) {
                return res.write('Order list errors')
            }

            res.render('dashboard', {title: "My Orders", orders: orders, 
                                                        user:req.user, 
                                                        loginMsg: req.flash('loginMsg'),  
                                                        userInfoUpdated : req.flash('userInfoUpdated'),
                                                        orderStatus : req.flash('orderStatus'),
                                                        orderDeleted : req.flash('orderDeleted'),
                                                        orderStatusUpdated : req.flash('orderStatusUpdated'),
                                                        
                                                    });
        });
    } catch (err) {
        console.log(err)
        
    }
});

// Renders the dashboard of the connected user 
router.get('/dashboard', authCheck, authRole(ROLE.ADMIN), (req, res) =>{

    try {
        Order.find({}, function (err, orders) {
            if (err) {
                return res.write('Order list errors')
            }

            res.render('dashboard', {title: "My Orders", orders: orders, 
                                                        user:req.user, 
                                                        loginMsg: req.flash('loginMsg'),  
                                                        userInfoUpdated : req.flash('userInfoUpdated'),
                                                        OrderStatus : req.flash('OrderStatus'),
                                                        orderDeleted : req.flash('orderDeleted'),
                                                        orderStatusUpdated : req.flash('orderStatusUpdated'),
                                                       
                                                        });

        }).populate('user')
    } catch (err) {
        console.log(err)
        
    }

});

// Renders the profile of the Admin user 
router.get('/profile', authCheck, authRole(ROLE.ADMIN), (req, res) =>{

    res.render('manage-profile', {user:req.user, userInfoUpdated:req.flash('userInfoUpdated')});

});

// Renders all the products available
router.get('/products', authCheck, authRole(ROLE.ADMIN), (req, res) =>{
    Product.find({}, (err, product) =>{
        if (err) {
            console.log(err);
            res.status(500).send('An error occurred', err);
        }
        else {
            res.render('manage-products', { user:req.user, 
                                            products: product, 
                                            productAdded: req.flash('productAdded'),
                                            productUpdated: req.flash('productUpdated'),
                                            productDeleted: req.flash('productDeleted'),
                                        });
        }
    });
});

// renders a specific product
router.get('/products/:id', authCheck, authRole(ROLE.ADMIN), (req, res) => {
    const id = req.params.id;

    Product.findById(id)
    .then(result => {
        res.render('manage-product-detail', {user:req.user, product:result, reviewStatus : req.flash('reviewStatus')});

    })
    .catch(err => {
        console.log("The product detail link is not correct!\n Redirection to product listing ...");
        res.redirect('/admin/products');

    })
})

// Renders the dashboard of all the users 
router.get('/users', authCheck, authRole(ROLE.ADMIN), (req, res) =>{
    User.find({}, (err, user) => {
        if(err){
            console.log(err);
            res.status(500).send('An error occurred', err);
        }
        else{
            res.render('manage-users', {user:user,
                                        userInfoUpdated:req.flash('userInfoUpdated'),
                                        userDeleted: req.flash('userDeleted')})
        }
    });

    
});

// Renders the add product admin page 
router.get('/addProduct', authCheck, authRole(ROLE.ADMIN), (req, res) =>{
    Product.find({}, (err, product) =>{
        if(err){
            console.log(err);

        }
        else{
            
            res.render('add-product', {user:req.user, product:product});

        }
    })
});

// Add a product in the products listing
router.post('/addProduct', authCheck, authRole(ROLE.ADMIN), upload.single('picture'), async (req, res, next) => {

    console.log(req.file);

    try{
        const { filename: image } = req.file;

        await sharp(req.file.path)
            .resize(450, 600)
            .jpeg({ quality: 90 })
            .toFile(
                path.resolve(req.file.destination, 'resized', image)
            )
            sharp.cache(false);
            console.log(req.file.path)


        let product = new Product({
            name: req.body.name,
            smallPrice: req.body.smallPrice,
            mediumPrice: req.body.mediumPrice,
            bigPrice: req.body.bigPrice,
            picture: req.file.filename,
            category: req.body.category,
            description: req.body.description,
            price : 0
        });

        // Checks if the food item already exists in the Product collection

        if(Product.find({"name" : req.body.name}).count() > 0){
            console.log('The product already exists !');
        }else{

            product = product.save();
            req.flash('productAdded', 'New product has been added');
            console.log('The product has been added successfully !');
            res.redirect('/admin/products');
        }

    }catch(err){
        console.log(err);
    }
});


// Renders the update product admin page 
router.get('/products/update/:id', authCheck, authRole(ROLE.ADMIN), (req, res) =>{
    const id = req.params.id;

    Product.findById(id)
        .then(result => {
            res.render('update-product', { title: 'Update Product', product: result, user: req.user });
        })
        .catch((err) =>{
            console.log(err);

        });
});

// Updates product details 
router.patch('/updateproduct/:id', authCheck, authRole(ROLE.ADMIN), upload.single('picture'), async(req, res) =>{

    req.product = await Product.findByIdAndUpdate(req.params.id);

    try {
        
        // To resize the picture
        const { filename: image } = req.file;
        await sharp(req.file.path)
        .resize({
            width: 600,
            height: 450,
            fit: sharp.fit.cover,
            position: sharp.strategy.entropy
          })
            .jpeg({ quality: 90 })
            .toFile(
                path.resolve(req.file.destination, 'resized', image)
            )
        fs.unlinkSync(req.file.path)

        let product = req.product;

        product.name = req.body.name;
        product.smallPrice = req.body.smallPrice;
        product.mediumPrice = req.body.mediumPrice;
        product.bigPrice = req.body.bigPrice;
        product.picture = req.file.filename;
        product.category = req.body.category;

        product = await product.save();

        //redirect to show route
        req.flash('productUpdated', 'Product has been updated');
        console.log("The product is updated !");
        res.redirect('/admin/products');

    } catch (error) {
        // res.redirect('/admin/products')
        console.log(error);
    }
});

// Deletes a selected product
router.delete('/products/delete/:id', authCheck, authRole(ROLE.ADMIN), (req, res) =>{

    const id = req.params.id;

    Product.findByIdAndDelete(id)
        .then(result => {
            
            req.flash('productDeleted', 'Product has been removed');
            res.json({redirect: '/admin/products'});
        })
        .catch(err => {
            console.log(err);

        });
});

// Renders a specific user details
router.get('/users/:id', authCheck, authRole(ROLE.ADMIN), (req, res) => {
    const id = req.params.id;

    User.findById(id)
    .then(result => {
        res.render('view-user', {user:result});

    })
    .catch(err => {
        console.log("The user detail link is not correct!\n Redirection to product listing ...");
        res.redirect('back');

    })
})

// Deletes a selected user
router.delete('/users/delete/:id', authCheck, authRole(ROLE.ADMIN), (req, res) =>{

    const id = req.params.id;

    User.findByIdAndDelete(id)
        .then(result => {
            
            req.flash('userDeleted', 'The user has been deleted');
            res.json({redirect: '/admin/users'});
        })
        .catch(err => {
            console.log(err);

        });
});


// admin updates user details 
router.patch('/updateuser/:id', authCheck, authRole(ROLE.ADMIN), upload.single('picture'), async(req, res) =>{

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
        res.redirect('/admin/users');

    } catch (error) {
        console.log(error);
        res.redirect('/admin/users');
    }
});

// admin updates user details 
router.patch('/updatestatus/:id', authCheck, authRole(ROLE.ADMIN), upload.single('picture'), async(req, res) =>{

    try {
        
        let order = await Order.findByIdAndUpdate(req.params.id);;

        order.status = "Delivered";

        order = await order.save();

        // //redirect to show route
        req.flash('orderStatusUpdated', 'The Order is delivered');
        console.log("The order is delivered !");
        res.redirect('/admin/dashboard');

    } catch (error) {
        console.log(error);
        res.redirect('/admin/dashboard');
    }
});

// Renders a specific order details
router.get('/order/:id', authCheck, authRole(ROLE.ADMIN), (req, res) => {
    const id = req.params.id;

    Order.findById(id)
    .populate('user')
    .then(result => {
        
        res.render('view-order', {user:req.user, order: result});

    })
    .catch(err => {
        console.log("The order detail link is not correct!\n Redirection to orders listing ...");
        res.redirect('back');

    })
})

// admin updates order details 
router.patch('/updateOrderInfo/:id', authCheck, authRole(ROLE.ADMIN), upload.single('picture'), async(req, res) =>{
    
    try {
        
        let order = await Order.findByIdAndUpdate(req.params.id);;

        order.email = req.body.email;
        order.address = req.body.address;
        order.zipCode = req.body.zipcode;
        order.city = req.body.city;
        order.country = req.body.country;

        order = await order.save();

        //redirect to show route
        req.flash('OrderStatus', 'The order info have been updated');
        console.log("The order info have been updated !");
        res.redirect('/admin/dashboard');

    } catch (error) {
        console.log(error);
        res.redirect('/admin/dashboard');
    }
});

// Deletes a selected order
router.delete('/order/delete/:id', authCheck, authRole(ROLE.ADMIN), (req, res) =>{

    const id = req.params.id;

    Order.findByIdAndDelete(id)
        .then(result => {
            
            req.flash('orderDeleted', 'The order has been deleted');
            res.json({redirect: '/admin/dashboard'});
        })
        .catch(err => {
            console.log(err);

        });
});

// Renders the reviews of all the users
router.get('/reviews', authCheck, authRole(ROLE.ADMIN), (req, res) =>{

    try {
        Review.find({}, function (err, reviews) {
            if (err) {
                return res.write('Order list errors')
            }

            res.render('manage-reviews', {title: "Reviews", reviews: reviews, 
                                                        user:req.user,  
                                                        reviewStatus : req.flash('reviewStatus')});

        }).populate('author');
    } catch (err) {
        console.log(err)
        
    }

});

// Renders a specific review details
router.get('/reviews/:id', authCheck, authRole(ROLE.ADMIN), (req, res) => {
    const id = req.params.id;

    Review.findById(id)
    .populate('author')
    .then(result => {


        res.render('view-review', {user: req.user, review:result});

    })
    .catch(err => {
        console.log("The review detail link is not correct!\n Redirection to review listing ...");
        res.redirect('back');

    })

})

// Deletes a selected order
router.delete('/reviews/delete/:id', authCheck, authRole(ROLE.ADMIN), (req, res) =>{

    const id = req.params.id;

    Review.findByIdAndDelete(id)
        .then(result => {
            
            req.flash('reviewStatus', 'The review has been removed');
            res.json({redirect: '/admin/reviews'});
        })
        .catch(err => {
            console.log(err);

        });
});

// ===============================================================================================



module.exports = router;