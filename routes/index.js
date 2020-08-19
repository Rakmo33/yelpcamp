// Routers
var express = require("express")
var router = express.Router()

// Password reset stuff
var async = require("async");
var nodemailer = require("nodemailer");
var crypto = require("crypto");

// User model
var User = require("../models/user")
const Campground = require("../models/campground");

// Authentication
var passport = require("passport")

// Middleware
const { isLoggedIn } = require('../middleware/index');

// Set your secret key. Remember to switch to your live secret key in production!
// See your keys here: https://dashboard.stripe.com/account/apikeys
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);



// ************ CLOUDINARY FOR ADDING IMAGE ************************

var multer = require('multer');
var storage = multer.diskStorage({
  filename: function (req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
  // accept image files only
  // if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
  //   return cb(new Error('Only image files are allowed!'), false);
  // }
  cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter })

var cloudinary = require('cloudinary');
cloudinary.config({
  cloud_name: 'rakmo33',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

//****************************************************************** */

var newUser;
var globalPassword;
var globalEmail;
var globalAvatarPath;
var globalResetPasswordToken;
var globalResetPasswordExpires;

//? HOME ROUTE //////////////////////////////////////////////
router.get("/", function (req, res) {
  // render landing page
  res.render("landing.ejs")
})

//? Register form //////////////////////////////////////////////
router.get("/register", function (req, res) {
  // renders register forms which submits to /verify
  res.render("register.ejs", { page: "register" })
})


//? SEND OTP mail after validation////////////////////////////////////
router.post("/verify", upload.single('image'), async function (req, res, next) {

  var userExists;

  // If user with same email exists, return back
  await User.findOne({ email: req.body.email }, function (err, foundUser) {
    if (foundUser) {
      req.flash("error", "A user with given email address already exists! Please try another Email ID.");
      userExists = true;
      return res.redirect("back")
    }
    else
      userExists = false;
  })

  if (userExists) {
    await console.log("[ ERROR : User with same email ID exists! ]");
    return
  }


  // Avatar image upload
  try {
    // File format checking
    if (!req.file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
      req.flash("error", "File format not supported! Please upload only png/jpg/jpeg files.");
      return res.redirect("back");
    }

    // storing temporary path
    globalAvatarPath = req.file.path;

  } catch (err) {
    req.flash("error", err.message);
    return res.redirect("back");
  }

  // Storing user information from the form temporarily
  newUser = new User({
    username: req.body.username,
    firstName: req.body.firstname,
    lastName: req.body.lastname,
    email: req.body.email,
    avatar: {
      url: req.file.path,//these fields will be updated when user will be verified
      public_id: "123"
    },
    bio: req.body.bio
  })

  globalPassword = req.body.password;

  async.waterfall([
    //! function1 : create a token for OTP
    function (done) {
      crypto.randomBytes(4, function (err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    //! function2 : storing token
    function (token, done) {
      
      // Storing the token and session info
      globalResetPasswordToken = token;
      globalResetPasswordExpires = Date.now() + 3600000; // 1 hour

      done(null, token);

    },
    //! SENDING OTP via GMAIL
    function (token, done) {
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
        subject: 'Verify your Email for YelpCamp',
        text: 'Here is your One Time Password : ' + token
      };


      smtpTransport.sendMail(mailOptions, function (err) {
        console.log('[ SUCCESS : OTP mail sent to ' + req.body.email + ']');
        req.flash('success', 'Check your email : ' + req.body.email + '. Confirm your Email ID by entering the OTP sent to you.');
        done(err, 'done');
      });
    }
  ], 
  // ! Redirect to /verify
  function (err) {

    if (err)
      return next(err);

    res.redirect('/verify');
  });

})

// ? Confirm otp //////////////////////////////////////////////
router.get("/verify", function (req, res) {
  // render OTP form which submits to /register
  res.render("otp.ejs")
})


// ? REGISTER ROUTE ///////////////////////////////////////////////
router.post("/register", upload.single('image'), function (req, res) {

  async.waterfall([
    //! function 1 : confirm OTP + upload DP to coudinary + register and login user + redirect to checkout
    function (done) {

      // Checking if OTP is valid
      if (globalResetPasswordToken != req.body.otp || globalResetPasswordExpires < Date.now()) {
        req.flash('error', 'OTP entered is Invalid or Expired! Make sure you enter the otp within 30 minutes of recieving the mail!');
        console.log("[ ERROR : OTP error ]")
        return res.redirect('back');
      }

      // Resetting the otp token
      globalResetPasswordExpires = undefined;
      globalResetPasswordToken = undefined;

      // uploading temporarily saved DP and getting a permanent URL for it
      cloudinary.v2.uploader.upload(globalAvatarPath, function (err, result) {

        if (err) {
          req.flash('error', err.message);
          return res.redirect('back');
        }

        // updating user info
        newUser.avatar.url = result.secure_url;
        newUser.avatar.public_id = result.public_id;

        // Registering User
        User.register(newUser, globalPassword, function (err, user) {
          if (err) {
            console.log("[ ERROR : User cannot be registered! ]" + err.message)
            req.flash("error", err.message)
            res.redirect("back")
          }
          else {

            // User registered and logged in automatically!
            req.logIn(user, function (err) {
              done(err, user);
            });

            console.log("[ SUCCESS : User registered successfully! ]")
            req.flash("success", "Signed Up Successfully! Welcome to yelpcamp, " + user.username + " !")

            // For payment
            res.redirect("/checkout")
          }
        })
      });
    },
    //! function 2 : send account verification mail 
    function (user, done) {
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
      smtpTransport.sendMail(mailOptions, function (err) {
        console.log("[ SUCCESS : Account verified! Verification mail sent!]")
        req.flash('success', 'Success! Your account has been verified.');
        done(err);
      });
    }
  ], 
  // ! function 3 : redirect to main page
  function (err) {
    res.redirect('/campgrounds');
  });
})


//? Login form ///////////////////////////////////////////
router.get("/login", function (req, res) {
  // render login form
  res.render("login.ejs", { page: "login" })
})

//? Login logic/////////////////////////////////////////////
router.post('/login', function (req, res, next) {

  // Passport authentication
  passport.authenticate('local', function (err, user, info) {
    if (err) {
      return next(err); // will generate a 500 error
    }
    // Generate a JSON response reflecting authentication status
    if (!user) {
      req.flash('error', 'authentication failed')
      return res.redirect('back')
      // return res.send(401,{ success : false, message : 'authentication failed' });
    }
    req.login(user, function (err) {
      if (err) {
        req.flash('error', 'authentication failed')
        return res.redirect('back')
      }

      req.flash('success', 'authentication succeeded')
      console.log("[ SUCCESS : User logged in ]")
      return res.redirect('/campgrounds')
    });
  })(req, res, next);
});

//? Logout /////////////////////////////////////////////////////
router.get("/logout", function (req, res) {
  req.logOut();
  req.flash("success", "Goodbye!")
  console.log("[ SUCCESS : User logged Out ]")
  res.redirect("/")
})

// ? GET Checkout /////////////////////////////////////////////
router.get('/checkout', isLoggedIn, (req, res) => {

  if (req.user.isPaid) {
    req.flash('success', 'Your account is already paid!')
    return res.redirect('/campgrounds', {})
  }

  // Pay 100 paise (Re 1)
  res.render('checkout.ejs', { amount: 100 });

});

// ? POST Checkout
router.post('/pay', isLoggedIn, async (req, res) => {

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

    console.log("[ SUCCESS :  Payment received! ]");
    // The payment is complete and the money has been moved

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

//? forgot password/////////////////////////////////////////////////
router.get('/forgot', function (req, res) {
  res.render('forgot.ejs');
});

//? Forgot POST ///////////////////////////////////////////////
router.post('/forgot', function (req, res, next) {
  async.waterfall([
    //! function 1 : generate token
    function (done) {
      crypto.randomBytes(20, function (err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    // ! function 2 : Check if user exists and store OTP info
    function (token, done) {
      User.findOne({ email: req.body.email }, function (err, user) {
        if (!user) {
          req.flash('error', 'No account with that email address exists.');
          return res.redirect('/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function (err) {
          done(err, token, user);
        });
      });
    },
    // ! function 3 : send forgot password mail
    function (token, user, done) {
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
          'http://' + req.headers.host + '/reset/' + token + '\n\n' + ' or ' + 'https://yelpcamp-project-001.herokuapp.com/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, function (err) {
        console.log('[ SUCCESS : Forgot password mail sent! ]');
        req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
        done(err, 'done');
      });
    }
  ],
  //! functon 3 : redirect nowhere 
   function (err) {
    if (err) return next(err);
    res.redirect('/forgot');
  });
});

// ? Password reset link to render password reset form
router.get('/reset/:token', function (req, res) {
  // ! Check if a user with password reset token exists
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function (err, user) {
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      console.log("[ ERROR : password reset token not valid")
      return res.redirect('/forgot');
    }
    // Render password rset form
    res.render('reset.ejs', { token: req.params.token });
  });
});

// ?
router.post('/reset/:token', function (req, res) {
  async.waterfall([
    // ! find user, validate token, confirm password, reset password
    function (done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function (err, user) {
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }
        if (req.body.password === req.body.confirm) {
          user.setPassword(req.body.password, function (err) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            user.save(function (err) {
              req.logIn(user, function (err) {
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
    // ! send password reset mail
    function (user, done) {
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
      smtpTransport.sendMail(mailOptions, function (err) {
        req.flash('success', 'Success! Your password has been changed.');
        done(err);
      });
    }
  ], 
  // ! redirect to main page
  function (err) {
    res.redirect('/campgrounds');
  });
});

// ? AJAX SEARCH autocomplete
router.get('/autocomplete/', function (req, res, next) {

  var regex = new RegExp(req.query["term"], 'i');
  var campgroundFilter = Campground.find({ name: regex }, { 'name': 1 }).sort({ "updated_at": -1 }).sort({ "created_at": -1 }).limit(20);
  campgroundFilter.exec(function (err, data) {

    var result = [];
    if (!err) {
      if (data && data.length && data.length > 0) {
        data.forEach(function (camp) {
          let obj = {
            id: camp._id,
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
