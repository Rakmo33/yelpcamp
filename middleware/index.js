var Comment = require("../models/comments")
var Campground = require("../models/campground");
const User = require("../models/user");


var middlewareObj = {}

middlewareObj.isLoggedIn = function (req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    if(req.xhr){
        return res.sennd({error:  "Login Required!"})
    }

    
    req.flash("error", "Log in required!")
    res.redirect("/login")
}

middlewareObj.isPaid = function (req, res, next) {
    if (req.user.isPaid) {
        return next();
    }
   

    req.flash("error", "Registration Fees not paid!")
    res.redirect("/checkout")
}

// IS BLOCKED
middlewareObj.isNotBlocked = function (req, res, next) {
    if (!req.user.isBlocked) {
        return next();
    }  

    req.flash("error", "Permission Denied!")
    res.redirect("back")
}

// IS ADMIN
middlewareObj.isAdmin = function (req, res, next) {
    if (req.user.isAdmin) {
        return next();
    }  

    req.flash("error", "You are not an admin!")
    res.redirect("back")
}

// IS ADMIN
middlewareObj.checkUser = function (req, res, next) {

    User.findById(req.params.id, function (err, foundUser) {
        if (err || !foundUser) {//? if user not found
            req.flash("error", "Something Went Wrong!")
            res.redirect("back")
        }
        else {//? user found
            //! .equals() is a mongoose method, we can now compare mongoose object with a string
            if (foundUser._id.equals(req.user._id) || req.user.isAdmin) {//?is user allowed
                next();
            } else {//? user not allowed
                req.flash("error", "Permisson Denied!")
                res.redirect("back")
            }
        }
    })
}


middlewareObj.checkCampgroundOwnership = function (req, res, next) {
    //? If logged in
    if (req.isAuthenticated()) {
        Campground.findById(req.params.id, function (err, foundCampground) {
            if (err || !foundCampground) {//? if campground not found
                req.flash("error", "Something Went Wrong!")
                res.redirect("back")
            }
            else {//? campground found
                //! .equals() is a mongoose method, we can now compare mongoose object with a string
                if (foundCampground.author.id.equals(req.user._id) || req.user.isAdmin) {//?is user allowed
                    next();
                } else {//? user not allowed
                    req.flash("error", "You are not the author! Permisson Denied!")
                    res.redirect("back")
                }
            }
        })
    } else {//? not logged in
        req.flash("error", "Log in Required!")
        res.redirect("back")
    }
}

middlewareObj.checkCommentOwnership = function (req, res, next) {
    //? If logged in
    if (req.isAuthenticated()) {
        Comment.findById(req.params.comment_id, function (err, foundComment) {
            if (err || !foundComment) {//? if comment not found
                req.flash("error", "Something Went Wrong!")
                res.redirect("/campgrounds")
            } else {//? comment found
                Campground.findById(req.params.id, function (err, foundCampground) {
                    if (!err) {
                        if (foundComment.author.id.equals(req.user._id) || foundCampground.author.id.equals(req.user._id) || req.user.isAdmin) {//?is user allowed
                            next();
                        } else {//? user not allowed
                            req.flash("error", "You are not the author! Permisson Denied!")
                            res.redirect("back")
                        }
                    }
                })
                //! .equals() is a mongoose method, we can now compare mongoose object with a string

            }
        })
    } else {//? not logged in
        req.flash("error", "Log in Required!")
        res.redirect("back")
    }
}

module.exports = middlewareObj


