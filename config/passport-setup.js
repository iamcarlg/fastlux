const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20');
const keys = require('./keys');
const User = require("../models/user-model");

passport.serializeUser((user, done) => {
    done(null, user.id);

})

passport.deserializeUser((id, done) =>{
    User.findById(id).then((user) =>{
        done(null, user);
    });

})

// Passport setup with Google Strategy 
passport.use(
    new GoogleStrategy({
        // Options for the google strategy

        callbackURL : '/auth/google/redirect',
        clientID : keys.google.clientID,
        clientSecret : keys.google.clientSecret

    }, (accessToken, refreshToken, profile, done) =>{

        // Check if the user already exists in our db
        User.findOne({googleId:profile.id}).then((currentUser) => {

            
            if(currentUser){
                // The user already exist
                console.log("The user is : " + currentUser);
                done(null, currentUser);

            }else{
                // The user doesn't exist
                console.log(profile);
                
                // Save the new user to the User database
                new User({
                    username : profile.displayName,
                    googleId : profile.id,
                    thumbnail : profile._json.picture,
                    email : profile._json.email,

                }).save().then((newUser) => {
                    console.log("New user created : " + newUser);
                    done(null, newUser);

                });
            }

        })
        // passport callback function
        console.log("Passport callback function fired !");
        console.log(profile);

    })
)