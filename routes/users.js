var express = require("express")
var router = express.Router()
var User = require("../models/user")
var middleware = require("../middleware")

// ************ CLOUDINARY FOR ADDING IMAGE ************************

var multer = require('multer');
var storage = multer.diskStorage({
    filename: function (req, file, callback) {
        callback(null, Date.now() + file.originalname);
    }
});
var imageFilter = function (req, file, cb) {
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

//  ? view USER PROFILE///////////////////////////////////
router.get("/:id", middleware.isLoggedIn, middleware.isPaid, function (req, res) {
    User.findById(req.params.id, function (err, foundUser) {
        if (err || !foundUser) {
            req.flash("error", "something went wrong!")
            res.redirect("back")
        } else {
            res.render("users/show.ejs", { user: foundUser })
        }
    })
})

//  ? view ALL USERS ///////////////////////////////////
router.get("/", middleware.isLoggedIn, middleware.isAdmin, function (req, res) {

    // res.render("users/showall.ejs", { users: allUsers, currentUser: req.user})

    User.find({}, function (err, allUsers) {

        if (err) {
            req.flash("error", "something went wrong!")
            res.redirect("/campgrounds")
        } else {
            res.render("users/showall.ejs", { users: allUsers, currentUser: req.user })
        }
    })
})


//? EDIT FORM/////////////////////////////////////////////////////////////
router.get("/:id/edit", middleware.isLoggedIn, middleware.isPaid, middleware.isNotBlocked, middleware.checkUser, function (req, res) {

    User.findById(req.params.id, function (err, foundUser) {
        if (err) {
            req.flash("error", "something went wrong!")
            res.redirect("back")
        } else {
            res.render("users/edit.ejs", { user: foundUser })
        }
    })

})


//? UPDATE ROUTE
router.put("/:id", upload.single('user[image]'), middleware.isLoggedIn, middleware.isPaid, middleware.isNotBlocked, middleware.checkUser, function (req, res) {

    User.findById(req.params.id, async function (err, user) {
        if (err) {
            req.flash("error", err.message);
            res.redirect("back");
        }
        else {
            // if image is uploaded
            if (req.file) {

                try {

                    // File format checking
                    if (!req.file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
                        req.flash("error", "File format not supported! Please upload only png/jpg/jpeg files.");
                        return res.redirect("back");
                    }

                    await cloudinary.v2.uploader.destroy(user.avatar.url);
                    var result = await cloudinary.v2.uploader.upload(req.file.path);
                    user.avatar.public_id = result.public_id;
                    user.avatar.url = result.secure_url;

                } catch (err) {
                    req.flash("error", err.message);
                    return res.redirect("back");
                }

            }

            if (req.body.deleteImage && req.body.deleteImage.length) {

                // updating user info
                user.avatar.url = "https://res.cloudinary.com/rakmo33/image/upload/v1598011377/avatar-1577909_1280_pvmw0e.webp";
                user.avatar.public_id = "avatar-1577909_1280_pvmw0e";
            }

            user.firstName = req.body.user.firstName;
            user.lastName = req.body.user.lastName;
            user.email = req.body.user.email;
            user.bio = req.body.user.bio;

            user.save();


            req.flash("success", "Successfully Updated Profile!");
            console.log("[ SUCCESS : Profile updated! ]")
            res.redirect("/users/" + user._id);
        }
    });

})

//? BLOCK
router.get("/:id/block", middleware.isLoggedIn, middleware.isPaid, middleware.isNotBlocked, middleware.isAdmin, function (req, res) {

    User.findById(req.params.id, function (err, foundUser) {
        if (err) {
            req.flash("error", "something went wrong!")
            res.redirect("back")
        } else {

            if (foundUser.isBlocked) {
                foundUser.isBlocked = false;
                req.flash("success", "User successfully unblocked!")
            }
            else {
                foundUser.isBlocked = true;
                req.flash("success", "User successfully blocked!")
            }
            foundUser.save();

            res.redirect("back")
        }
    })
})


module.exports = router;


