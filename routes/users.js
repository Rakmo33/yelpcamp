var express = require("express")
var router = express.Router()
var User = require("../models/user")
var middleware = require("../middleware")



//  ? view USER PROFILE
router.get("/:id",middleware.isLoggedIn, middleware.isPaid, function(req, res){
    User.findById(req.params.id, function(err, foundUser){
        if(err){
            req.flash("error", "something went wrong!")
            res.redirect("back")
        }else{
            console.log("found user : *********** \n"+foundUser)
            res.render("users/show.ejs", {user: foundUser})
        }
    })
})


//? EDIT FORM
router.get("/:id/edit",middleware.isLoggedIn, middleware.isPaid, middleware.isNotBlocked, middleware.checkUser,  function (req, res) {

    User.findById(req.params.id, function (err, foundUser) {
        if(err){
            req.flash("error", "something went wrong!")
            res.redirect("back")
        }else{
            res.render("users/edit.ejs", {user: foundUser})
        }
    })

})


//? UPDATE ROUTE
router.put("/:id",middleware.isLoggedIn, middleware.isPaid, middleware.isNotBlocked, middleware.checkUser, function (req, res) {  

    
        User.findByIdAndUpdate(req.params.id, req.body.user, function(err, user){
            if(err){
                req.flash("error", err.message);
                res.redirect("back");
            } else {               
                req.flash("success","Successfully Updated!");
                res.redirect("/users/" + user._id);
            }
        });
     
})

//? BLOCK
router.get("/:id/block",middleware.isLoggedIn, middleware.isPaid, middleware.isNotBlocked,middleware.isAdmin,  function (req, res) {

    User.findById(req.params.id, function (err, foundUser) {
        if(err){
            req.flash("error", "something went wrong!")
            res.redirect("back")
        }else{

            console.log("found user to block**************")
            console.log(foundUser)

            if(foundUser.isBlocked){
                foundUser.isBlocked = false;
                req.flash("success", "User successfully unblocked!")
            }
            else{
                foundUser.isBlocked = true;
                req.flash("success", "User successfully blocked!")
            }
            foundUser.save();

            res.redirect("back")
        }
    })
})


module.exports = router;


