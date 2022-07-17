const router = require('express').Router();
const nodemailer = require('nodemailer'); // Module to send emails
const bodyParser = require('body-parser'); //import bodyParser to call data with req.body

const keys = require("../config/keys"); // Importing the key module

// const ROLE = require('../models/user-role');
const Product = require('../models/product-model');

const urlencodedParser = bodyParser.urlencoded({ extended: true }); // Parsing HTML data on the server

// Parsing data from HTML inputs
router.use(bodyParser.json());
router.use(urlencodedParser);

// ================================   NON-CONNECTED USERS    ===============================

// Renders the Home Page
router.get('/', (req, res) => {

    Product.find({}, (err, product) =>{
        if (err) {
            console.log(err);
            res.status(500).send('An error occurred', err);
        }
        else {
            res.render('index',  {qs: req.query, 
                                    user: req.user, 
                                    logoutMsg:req.flash('logoutMsg'),
                                    products:product});
        }
    });
    
})

// Renders the Menu Page
router.get('/menu', (req, res) => {
    Product.find({}, (err, product) =>{
        if (err) {
            console.log(err);
            res.status(500).send('An error occurred', err);
        }
        else {
            res.render('menu', {user:req.user, products: product});

        }
    });
})

// Renders the About Page
router.get('/about', (req, res) => {
    res.render('about');
})

// Renders the Contact Page
router.get('/contact', (req, res) => {

    res.render('contact', {qs: req.query, emailSent:req.flash('emailSent')});

})

// Post method to send an email using contact form
router.post('/contact', urlencodedParser, (req, res) => {

    const from = req.body.mail;
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

        res.redirect("/contact");

        });

    // After the email is successful, renders the contact page with success message
    req.flash('emailSent', 'Your message is sent successfully');
    res.redirect('/contact');

});

module.exports = router;