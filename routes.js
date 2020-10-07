const express = require('express');
const routes = express.Router();
const mongoose = require('mongoose');
const bodyparser = require('body-parser');
const bcrypt = require('bcryptjs');
const user = require('./model.js');
const passport = require('passport');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');
const mongourl = "mongodb://localhost:27017/session-login"



// using Bodyparser for getting form data
routes.use(bodyparser.urlencoded({ extended: true }));
// using cookie-parser and session 
routes.use(cookieParser('secret'));
routes.use(session({
    secret: 'secret',
    maxAge: 3600000,
    resave: true,
    saveUninitialized: true,
}));
// using passport for authentications 
routes.use(passport.initialize());
routes.use(passport.session());
// using flash for flash messages 
routes.use(flash());

// MIDDLEWARES
// Global variable
routes.use(function (req, res, next) {
    res.locals.success_message = req.flash('success_message');
    res.locals.error_message = req.flash('error_message');
    res.locals.error = req.flash('error');
    next();
});

const checkAuthenticated = function (req, res, next) {
    if (req.isAuthenticated()) {
        res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, post-check=0, pre-check=0');
        return next();
    } else {
        res.redirect('/login');
    }
}

// Connecting To Database
// using Mongo Atlas as database
mongoose.connect(mongourl ,{
    useNewUrlParser: true, useUnifiedTopology: true,
}).then(() => console.log("Database Connected")
);


// ALL THE ROUTES 
routes.get('/', (req, res) => {
    res.render('index');
});

routes.get('/register', (req, res) => {
    res.render('register');
})

routes.post('/register', (req, res) => {
    var { email, username, password, confirmpassword } = req.body;
    var err;
    if (!email || !username || !password || !confirmpassword) {
        err = "Please fill all input fields !";
        res.render('register', { 'err': err }); //index
    }
    if (password != confirmpassword) {
        err = "Passwords doen't match";
        res.render('register', { 'err': err, 'email': email, 'username': username }); //index
    }
    if (typeof err == 'undefined') {
        user.findOne({ email: email }, function (err, data) {
            if (err) throw err;
            if (data) {
                console.log("User Exists");
                err = "User already exists with this email !";
                res.render('register', { 'err': err, 'email': email, 'username': username }); //index
            } else {
                bcrypt.genSalt(10, (err, salt) => {
                    if (err) throw err;
                    bcrypt.hash(password, salt, (err, hash) => {
                        if (err) throw err;
                        password = hash;
                        user({
                            email,
                            username,
                            password,
                        }).save((err, data) => {
                            if (err) throw err;
                            req.flash('success_message', "Registered successfully !");
                            res.redirect('/login');
                        });
                    });
                });
            }
        });
    }
});


// Authentication Strategy
// ---------------
var localStrategy = require('passport-local').Strategy;
passport.use(new localStrategy({ usernameField: 'email' }, (email, password, done) => {
    user.findOne({ email: email }, (err, data) => {
        if (err) throw err;
        if (!data) {
            return done(null, false, { message: "User doesn't exists.." });
        }
        bcrypt.compare(password, data.password, (err, match) => {
            if (err) {
                return done(null, false);
            }
            if (!match) {
                return done(null, false, { message: "Password doesn't match" });
            }
            if (match) {
                return done(null, data);
            }
        });
    });
}));

passport.serializeUser(function (user, cb) {
    cb(null, user.id);
});

passport.deserializeUser(function (id, cb) {
    user.findById(id, function (err, user) {
        cb(err, user);
    });
});
// ---------------
// end of autentication statregy

routes.get('/login', (req, res) => {
    res.render('login');
});

routes.post('/login', (req, res, next) => {
    passport.authenticate('local', {
        failureRedirect: '/login',
        successRedirect: '/dashboard',  //success
        failureFlash: true,
    })(req, res, next);
});

routes.get('/dashboard', checkAuthenticated, (req, res) => {  //success
    res.render('dashboard', { 'user': req.user });   //success
});

routes.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/login');
});

routes.get('/homelogout', (req, res) => {
    req.logout();
    res.redirect('/');
});

routes.post('/addmsg', (req, res) => {
    user.findOneAndUpdate(
        { email: req.user.email },
        {
            $push: {
                messages: req.body['msg']
            }
        }, (err, suc) => {
            if (err) throw err;
            if (suc) console.log("Message added successfully !"); //notification functions:
        }
    );
    req.flash('success_message', "Message added successfully !");
    res.redirect('/dashboard');
});



module.exports = routes;