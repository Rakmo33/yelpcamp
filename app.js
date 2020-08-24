require('dotenv').config();

var express = require("express")
var app = express();
var bodyParser = require("body-parser")

var methodOverride = require("method-override")

var passport = require("passport")
var localStrategy = require("passport-local")

var mongoose = require("mongoose")

var User = require("./models/user")
var Campground = require("./models/campground")
var Comment = require("./models/comments")

Campground.find({},function(err, all){
  all.forEach(function(one){
    one.save();
  })
})

flash = require("connect-flash")
app.locals.moment = require('moment');

var activities = [];

User.find({}, function (err, allUsers) {

    if (err) {
      req.flash("error", "something went wrong!")
      res.redirect("/campgrounds")
    } else {

     

      allUsers.forEach(function (user) {
        user.activities.forEach(function (activity) {
          activities.push(activity)
        })
      })

      activities.sort((a, b) => {
        return a.createdAt < b.createdAt ? 1 : -1;
      })
    }
})

app.locals.activities = activities;

//? Requiring Routes
var campgroundRoutes = require("./routes/campgrounds")
var commentRoutes = require("./routes/comments")
var userRoutes = require("./routes/users")
var indexRoutes = require("./routes/index")

// pusher
// import * as PushNotifications from '@pusher/push-notifications-web'

// const PushNotifications = require('@pusher/push-notifications-web');


app.use(express.json())

//!PASSPORT CONFIGURATION

app.use(require("express-session")({
    secret: "This is rakmo's secret",
    resave: false,
    saveUninitialized: false
}))

app.use(methodOverride("_method"))

app.use(passport.initialize())
app.use(passport.session())

app.use(flash())

passport.use(new localStrategy(User.authenticate()))
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

var url = process.env.DATABASEURL || "mongodb://localhost/yelp_camp"

mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true })

// mongoose.connect("mongodb+srv://Rakmo33:Rakmo@750@cluster0-6u2il.gcp.mongodb.net/campgrounds_database?retryWrites=true&w=majority", {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//     useCreateIndex: true
// }).then(() => {
//     console.log("Database Connected!")
// }).catch(err => {
//     console.log("ERROR: ", err.message)
// })

app.use(bodyParser.urlencoded({ extended: true }))

//! IMP __dirname is current directory
app.use(express.static(__dirname + "/public"))

//! Middleware to pass req.user to all routes via res.locals
app.use(function (req, res, next) {
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
})

//? Using routers and also shortening urls by adding prefixes
app.use("/campgrounds", campgroundRoutes)
app.use("/campgrounds/:slug/comments", commentRoutes)
app.use("/users", userRoutes)
app.use(indexRoutes)

app.listen(process.env.PORT || 8000, process.env.IP, function () {
    console.log("Server Started at : PORT 8000 or "+ process.env.PORT)
})
