//Import of the express and Paypal-rest-sdk Modules
const router = require('express').Router();

//imports the paypal rest SDK
const paypal = require('paypal-rest-sdk');

//call the database models
const Product = require('../models/product-model');
const Order = require('../models/order-model');
//call the cart configurations
const Cart = require('../config/cart-config');

// middleware that allows us to send mails after successful order
const nodemailer = require("nodemailer");

const moment = require('moment'); //middleware for date formatting

//call on secret keys form the configs
const keys = require('../config/keys');

const visited = [];
const user_mail = [];
const base_url = "http://fastlux.herokuapp.com";
// const base_url = "http://localhost:3000";
/***********************************************************/

// Directs us to shipping information form
router.get('/shippinginformation', (req, res) => {
  try {
    res.render('shipping-information', { title: 'Shipping Information', user: req.user })
  } catch (err) {
    res.redirect('back');
    console.log("Could not find shipping information page", err);
  }
});

// The payment details that Paypal uses to initiate a transaction.
router.post('/checkout', (req, res) => {

  try {
    if (!req.session.cart) {
      return res.redirect('/cart')
    }
  } catch (err) {
    res.redirect('/casual/cart'); //is this the best redirect path?
    console.log("Could not find checkout page", err);
  }


  const cart = new Cart(req.session.cart);

  try {
    const create_payment_json = {
      "intent": "sale",
      "payer": {
        "payment_method": "paypal"
      },
      "redirect_urls": {
        "return_url": base_url + "/paypal/success",
        "cancel_url": base_url + "/paypal/cancel"
      },
      "transactions": [{
        "item_list": {
          "items": [{
            "name": "",
            "sku": "item",
            "price": 0,
            "currency": "EUR",
            "quantity": cart.totalQty
          }]
        },
        "amount": {
          "currency": "EUR",
          "total": Math.round(cart.totalPrice * 100) / 100
        },
        "description": ""
      }]
    }

    console.log(req.body.address)
    console.log(req.body.city)
    console.log(req.body.zipCode)
    console.log(req.body.email)
    
    // Save the shipping information to order database

    var date_ob = new Date();

    var day = ("0" + date_ob.getDate()).slice(-2);
    var month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
    var year = date_ob.getFullYear();

    var hours = date_ob.getHours();
    var minutes = date_ob.getMinutes();
    var seconds = date_ob.getSeconds();
      
    var dateTime = year + "-" + month + "-" + day + " " + hours + ":" + minutes + ":" + seconds;
    console.log(dateTime);

    var order = new Order({
      user: req.user,
      cart: cart,
      name : req.body.username,
      email : req.body.email,
      country: req.body.country,
      city: req.body.city,
      address: req.body.address,
      zipcode: req.body.zipCode,
      date : dateTime
    });


    order.save(function (err, result) {
      if (err) {
        console.log(err)

      }
    })

    paypal.payment.create(create_payment_json, function (error, payment) {
      if (error) {
        user_mail.length = 0;
        visited.length = 0;
        throw error;
      } else {
        for (let i = 0; i < payment.links.length; i++) {
          if (payment.links[i].rel === 'approval_url') {
            user_mail.push(order.email);
            visited.push(order);

            res.redirect(payment.links[i].href);
          }
        }
      }
    });



  } catch (error) {
    user_mail.length = 0;
    visited.length = 0;
    console.log(error)
  }
});

/***********************************************************/

//make sure its not hard-coded
// In case the operation is successful
router.get('/success', (req, res) => {
  const payerId = req.query.PayerID;
  const paymentId = req.query.paymentId;

  if (!req.session.cart) {
    user_mail.length = 0;
    visited.length = 0;
    return res.redirect('/casual/cart');
    
  }

  const cart = new Cart(req.session.cart);

  const execute_payment_json = {
    "payer_id": payerId,
    "transactions": [{
      "amount": {
        "currency": "EUR",
        "total": Math.round(cart.totalPrice * 100) / 100
      }
    }]
  };

  // Obtains the transaction details from paypal
  paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
    //When error occurs when due to non-existent transaction, throw an error else log the transaction details in the console then send a Success string response to the user.
    if (error) {
      visited.push(order);
      console.log(error.response);
      throw error;
    } else {
      console.log(JSON.stringify(payment));

      // Empties the shopping cart after sucessful payment
      let cart = new Cart(req.session.cart);

      // Generating a random order ID
      const val = Math.floor(1000 + Math.random() * 9000);
      console.log(val);


      // save order item
      const order = new Order({
        orderID : Math.floor(1000 + Math.random() * 9000),
        visited : visited,
        cart: cart,
        user: req.user,
        email : req.body.email,
        country: req.body.country,
        city: req.body.city,
        address: req.body.address,
        zipcode: req.body.zipCode,
      });

      req.session.cart = null;
      res.render('payment-success', {
        title: 'Order confirmation details',
        visited : visited,
        orderID : val,
        products: order.cart.generateArray(),
        totalPrice: order.cart.totalPrice,
        totalQty: order.cart.totalQty,
        user: req.user
      });

      visited.length = 0;

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: keys.nodemailer.user,
          pass: keys.nodemailer.pass
        }
      });


      const mailConfigurations = {

        // It should be a string of sender email
        from: 'fastluxbrand@gmail.com',
        // Comma Separated list of mails
        to: user_mail, //change to session based login
        // Subject of Email
        subject: 'Thanks for your order',
        // This would be the text of email body
        text: 'Dear customer, \n\nWe are grateful that you\'ve ordered our food items. \n Please, you can track your food status in your personal space.\n Your order is being processed. \nPlease note that we deliver between monday to friday, which are our couriers\' working days. \nNo need to camp out by the mailbox waiting for the postman.\n\nYours Sincerely,\nCarl,\nCustomer Support',
        
      };

      transporter.sendMail(mailConfigurations, function (error, info) {
        if (error) throw Error(error);
        console.log('Email Sent Successfully');
        console.log(info);
      });
    }
  });
});

/***********************************************************/

// If the user cancels the operation, the page sends 'Cancelled'
router.get('/cancel', (req, res) =>{

  user_mail.length = 0;
  visited.length = 0;
  res.redirect('/');

})      

  

/***********************************************************/

// Export of the paypal-routes Module
module.exports = router;