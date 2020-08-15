var express = require("express")
var router = express.Router()

// Password reset stuff
var async = require("async");
var nodemailer = require("nodemailer");
var crypto = require("crypto");

var User = require("../models/user")

var passport = require("passport")

const { isLoggedIn } = require('../middleware/index');
const Campground = require("../models/campground");

// Set your secret key. Remember to switch to your live secret key in production!
// See your keys here: https://dashboard.stripe.com/account/apikeys
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

var newUser;
var globalPassword;
var globalEmail;

//? HOME ROUTE
router.get("/", function (req, res) {
    res.render("landing.ejs")
})

//! AUTH ROUTES

//? Register form
router.get("/register", function (req, res) {
    res.render("register.ejs",{page:"register"})
})

//? CONFIRM OTP
router.post("/verify",function (req, res, next){

  newUser = new User({ 
    username: req.body.username,
    firstName : req.body.firstname,
    lastName : req.body.lastname,
    email : req.body.email,
    avatar: req.body.avatar,
    bio : req.body.bio
 })

 globalPassword = req.body.password;


  async.waterfall([
    function(done) {
      crypto.randomBytes(4, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ username: "dummy" }, function(err, user) {
        if (!user) {
          req.flash('error', 'dummy account needed');
          console.log("here")

          return res.redirect('/forgot');
        }


        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour



        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'rakmo.yelpcamp@gmail.com',
          pass: process.env.GMAILPW
        }
      });


      globalEmail = req.body.email;

      var mailOptions = {
        to: req.body.email,
        from: 'rakmo.yelpcamp@gmail.com',
        subject: 'Verify your email for YelpCamp',
        text: 'Here is your One Time Password : ' + token
          
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        console.log('mail sent');
        req.flash('success', 'An e-mail has been sent to ' + req.body.email + ' with further instructions.');
        done(err, 'done');
      });
    }
  ], function(err) {

    // if(err.message){
    //   console.log(err.message);
    //   res.redirect("back")
    // }
    if (err) return next(err);
    res.redirect('/verify');
  });
})

// ? Confirm otp
router.get("/verify", function(req, res){

  res.render("otp.ejs")

})


// ? REGISTER ROUTE
router.post("/register", function(req, res){

  async.waterfall([
    function(done) {
      User.findOne({ resetPasswordToken: req.body.otp, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          req.flash('error', 'Invalid OTP');
          return res.redirect('back');
        }
        
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            // alert("yoyo")
           

            user.save();

            
          


            User.register(newUser, globalPassword, function (err, user) {
              if (err) {
                  console.log("**********************" +err.message)
                  req.flash("error", err.message)
                  res.redirect("back")

              }
              else {

                  // passport.authenticate("local")(req, res, function () {
                    req.logIn(user, function(err) {
                      done(err, user);
                    });
                      req.flash("success", "Signed Up Successfully! Welcome to yelpcamp, " + user.username + " !")
  
                      res.redirect("/checkout")
                  // })
              }
          })
          
        
      });
    },
    function(user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'rakmo.yelpcamp@gmail.com',
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: globalEmail,
        from: 'rakmo.yelpcamp@gmail.com',
        subject: 'Your account has been verified',
        text: 'Hello,\n\n' +
          'This is a confirmation that your account with email address ' + user.email + ' has just been verified.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success', 'Success! Your account has been verified.');
        done(err);
      });
    }
  ], function(err) {
    res.redirect('/campgrounds');
  });
  
})


//? Login form
router.get("/login", function (req, res) {
    
   
    res.render("login.ejs",{page:"login"})
})

//? Login logic
// router.post("/login", passport.authenticate("local", {

//     successRedirect: "/campgrounds",
//     failureRedirect: "/login"
// }), function (req, res) {
    
// })

router.post('/login', function(req, res, next) {
    passport.authenticate('local', function(err, user, info) {
      if (err) {
        return next(err); // will generate a 500 error
      }
      // Generate a JSON response reflecting authentication status
      if (! user) {
        req.flash('error', 'authentication failed')
        return res.redirect('back')
        // return res.send(401,{ success : false, message : 'authentication failed' });
      }
      req.login(user, function(err){
        if(err){
            req.flash('error', 'authentication failed')
            return res.redirect('back')
        }

        req.flash('success', 'authentication succeeded')
             return res.redirect('/campgrounds')
      });
    })(req, res, next);
  });

//? Logout
router.get("/logout", function (req, res) {
    req.logOut();
    req.flash("success", "Goodbye!")
    res.redirect("/")
})

// ? GET Checkout
router.get('/checkout', isLoggedIn, (req, res) => {

    if(req.user.isPaid){
        req.flash('success', 'Your account is already paid!')
        return res.redirect('/campgrounds', {})
    }

    res.render('checkout.ejs', { amount : 100 });

});

// ? POST Checkout
router.post('/pay',isLoggedIn, async (req, res) => {

    const { paymentMethodId, items, currency } = req.body;

    const orderAmount = 100;
  
    try {
      // Create new PaymentIntent with a PaymentMethod ID from the client.
      const intent = await stripe.paymentIntents.create({
        amount: orderAmount,
        currency: currency,
        payment_method: paymentMethodId,
        error_on_requires_action: true,
        confirm: true
      });

      req.user.isPaid = true;
      await req.user.save()
  
      console.log("💰 Payment received!");
      // The payment is complete and the money has been moved
      // You can add any post-payment code here (e.g. shipping, fulfillment, etc)
  
      // Send the client secret to the client to use in the demo
      res.send({ clientSecret: intent.client_secret });
    } catch (e) {
      // Handle "hard declines" e.g. insufficient funds, expired card, card authentication etc
      // See https://stripe.com/docs/declines/codes for more
      if (e.code === "authentication_required") {
        res.send({
          error:
            "This card requires authentication in order to proceeded. Please use a different card."
        });
      } else {
        res.send({ error: e.message });
      }
    }
 });

 // forgot password
router.get('/forgot', function(req, res) {
  res.render('forgot.ejs');
});

router.post('/forgot', function(req, res, next) {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ email: req.body.email }, function(err, user) {
        if (!user) {
          req.flash('error', 'No account with that email address exists.');
          return res.redirect('/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'rakmo.yelpcamp@gmail.com',
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'rakmo.yelpcamp@gmail.com',
        subject: 'Node.js Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' + ' or ' +  'https://yelpcamp-project-001.herokuapp.com/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        console.log('forgot password mail sent');
        req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/forgot');
  });
});

router.get('/reset/:token', function(req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgot');
    }
    res.render('reset.ejs', {token: req.params.token});
  });
});

router.post('/reset/:token', function(req, res) {
  async.waterfall([
    function(done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }
        if(req.body.password === req.body.confirm) {
          user.setPassword(req.body.password, function(err) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            user.save(function(err) {
              req.logIn(user, function(err) {
                done(err, user);
              });
            });
          })
        } else {
            req.flash("error", "Passwords do not match.");
            return res.redirect('back');
        }
      });
    },
    function(user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'rakmo.yelpcamp@gmail.com',
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'rakmo.yelpcamp@gmail.com',
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success', 'Success! Your password has been changed.');
        done(err);
      });
    }
  ], function(err) {
    res.redirect('/campgrounds');
  });
});

router.get('/autocomplete/', function(req , res, next){

  var regex = new RegExp(req.query["term"], 'i');
  var campgroundFilter = Campground.find({name: regex},{'name':1}).sort({"updated_at":-1}).sort({"created_at":-1}).limit(20);
  campgroundFilter.exec(function(err, data){

    console.log("651613*****")
    console.log(data)

    var result = [];
    if(!err){

      if(data && data.length && data.length > 0){
        data.forEach(function(camp){
          let obj = {
            id : camp._id,
            label: camp.name
          }
          result.push(obj);
        });
        
      }

      res.jsonp(result);

    }
   

  })

})



 



module.exports = router;
