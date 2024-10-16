//==============     import nodejs modules        ==================/

const express = require('express');
const bodyParser = require('body-parser'); //import bodyParser to call data with req.body
const path = require('path'); // import path to provide utilities for working with file and directory paths
const mongoose = require('mongoose'); // import mongoose to have access to the mongodb database
const cookieSession = require('cookie-session'); // import cookie-session to have access to cookie session 
const passport = require('passport'); // import passport to initialize cookie
const session = require('express-session');
const flash = require('connect-flash'); // import connect-flash
const cookie_parser = require('cookie-parser'); // import cookie parser to clear the user cookie
//package to override the post method to create put method
const methodOverride = require('method-override');
const MongoStore = require('connect-mongo') // import connect-mongo to store session
const paypal = require('paypal-rest-sdk'); //Import paypal rest SDK

// ====================================================================


const keys = require("./config/keys");
const passportSetup = require("./config/passport-setup");

// Server is listening to port 3000 or process.env.PORT
const PORT = process.env.PORT || 3000;

// Running express
const app = express();

// Parsing HTML data on the server
const urlencodedParser = bodyParser.urlencoded({ extended: true });

// call the override function to change post to put
app.use(methodOverride('_method')); 

app.use(bodyParser.json());
app.use(urlencodedParser);

app.use(express.static(path.join(__dirname, 'public'))); //static folder that makes files in public folder show as views

// Encrypting sessions
app.use(cookieSession({
  maxAge : 24 * 40 * 60 * 1000,
  keys : [keys.session.cookieKey]

}));

// Initialize passport sessions
app.use(passport.initialize());
app.use(passport.session());

app.use( session({
  name : "parse-session",
  secret :"secret111",
  resave : true,
  saveUninitialized: true,
  cookie: { secure: false, maxAge: 14400000 },
})
);

app.use(cookie_parser()); // Handles removal of cookies for individual session
app.use(flash());

// Connect to mongodb
mongoose.connect(keys.mongodb.dbURI || process.env.MONGO_URL, () => {
  console.log("Connected to mongodb !");
  
});

app.use(session({
  secret: keys.session.expressKey,  //this key is used to encrypt the id so that it is encrypted by the time it reaches the browser
  resave: false, //add comment
  saveUninitialized: false, //add comment
  cookie: {
      maxAge: 180 * 60 * 1000
  }, //max age of the cookie we send out (we have set 24h)
  // Mongo session store for our cart.
  store: MongoStore.create({
      mongoUrl: keys.mongodb.dbURI
  }),    
}));

//configure paypal
paypal.configure({
  'mode': 'sandbox', //sandbox or live
  'client_id': keys.paypal.clientID,
  'client_secret': keys.paypal.clientSecret
});



//set view enginge to ejs
app.set('view engine', 'ejs');

//connect our views with our public folder
app.set('views', __dirname + '/public/views');

// make the session accessible everywhere
app.use(function (req, res, next) {
  res.locals.session = req.session;
  next();

})

// server listening to port 3000 or process.env.PORT
app.listen(PORT, () => {
    console.log(`Server running at ${PORT}...`);
  });

// ============  ALL ROUTES ============== //

// All the routes of the project
const authRoutes = require("./routes/auth-routes");
const publicRoutes = require("./routes/public-routes");
const adminRoutes = require("./routes/admin-routes");
const casualRoutes = require('./routes/casual-routes');
const paypalRoutes = require('./routes/paypal-routes');
// ========================================== //

// Redirection to the different routes
app.use('/', publicRoutes);
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/casual', casualRoutes);
app.use('/paypal', paypalRoutes);


