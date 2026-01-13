var express = require("express")
var app = express();

//? to access :id even after shortening url
var router = express.Router({ mergeParams: true })
var middleware = require("../middleware")
const { isLoggedIn, isPaid, isNotBlocked } = require("../middleware");


var Campground = require("../models/campground")
var Comment = require("../models/comments");
const { text } = require("body-parser");

// Apply to all routes
router.use(isLoggedIn, isPaid, isNotBlocked)


// var User = require("../models/user")

// var activities = [];

// User.find({}, function (err, allUsers) {

//     if (err) {
//       req.flash("error", "something went wrong!")
//       res.redirect("/campgrounds")
//     } else {     

//       allUsers.forEach(function (user) {
//         user.activities.forEach(function (activity) {
//           activities.push(activity)
//         })
//       })

//       activities.sort((a, b) => {
//         return a.createdAt < b.createdAt ? 1 : -1;
//       })
//     }
// })

// app.locals.activities = activities;


//! COMMENTS ROUTE
//? NEW
router.get("/new", function (req, res) {
    //find the campground with given id
    Campground.findOne({slug : req.params.slug}).populate("comments").exec(function (err, foundCampground) {
        //render show tempate
        res.render("comments/new.ejs", { campground: foundCampground })
    })
})

//? CREATE
router.post("/", function (req, res) {
    //looking up for campground using ID
    Campground.findOne({slug : req.params.slug}, function (err, campground) {
        if (err) {
            res.redirect("/campgrounds")
        }
        else {
            Comment.create(req.body.comment, function (err, comment) {
                if (err) {
                    res.redirect("/campground")
                }
                else {

                    comment.author.username = req.user.username;
                    comment.author.id = req.user._id;
                    comment.author.isAdmin = req.user.isAdmin;
                    comment.avatar = req.user.avatar.url;
                    comment.save();

                    campground.comments.push(comment);
                    campground.save()

                    var activity = {
                        action: "comment",
                        campground: {
                            name: campground.name,
                            slug: campground.slug,
                            author: campground.author.username
                        },
                        text: comment.text,
                        actor: req.user.username
                    }

                    req.user.activities.push(activity);
                    res.locals.activities.push(activity);

                    req.user.save();



                    let Pusher = require('pusher');
                    let pusher = new Pusher({
                        appId: process.env.PUSHER_APP_ID,
                        key: process.env.PUSHER_APP_KEY,
                        secret: process.env.PUSHER_APP_SECRET,
                        cluster: process.env.PUSHER_APP_CLUSTER
                    });

                    

                    pusher.trigger('notifications', 'new_comment', activity, req.headers['x-socket-id']);



                    res.redirect("/campgrounds/" + campground.slug);
                }
            })
        }
    })
})

//? EDIT
router.get("/:comment_id/edit", middleware.checkCommentOwnership, function (req, res) {


    Comment.findById(req.params.comment_id, function (err, foundComment) {
        if (err) {
            res.redirect("back")
        } else {

            res.render("comments/edit.ejs", { campgroundID: req.params.slug, comment: foundComment })

        }
    })

})

//? UPDATE
router.put("/:comment_id", middleware.checkCommentOwnership, function (req, res) {

    Campground.findOne({slug : req.params.slug}, function (err, campground) {
        if (err) {
            res.redirect("/campgrounds")
        }
        else {

            Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function (err, updatedComment) {
                if (err) {
                    res.redirect("back")
                } else {
                    var activity = {
                        action: "edit-comment",
                        campground: {
                            name: campground.name,
                            id: campground.id,
                            author: campground.author.username
                        },
                        text: updatedComment.text,
                        actor: req.user.username
                    }


                    req.user.activities.push(activity);
                    res.locals.activities.push(activity);

                    req.user.save();
                    res.redirect("/campgrounds/" + req.params.slug)
                }
            })

        }
    })
})

//? DESTROY
router.delete("/:comment_id", middleware.checkCommentOwnership, function (req, res) {

    Campground.findOne({slug : req.params.slug}, function (err, campground) {
        if (err) {
            res.redirect("/campgrounds")
        }
        else {
            Comment.findByIdAndRemove(req.params.comment_id, function (err) {
                if (err) {
                    // alert("cannot delete")
                    res.redirect("back")
                } else {
                    var activity = {
                        action: "delete-comment",
                        campground: {
                            name: campground.name,
                            id: campground.id,
                            author: campground.author.username
                        },
                        // text: comment.text,
                        actor: req.user.username
                    }

                    req.user.activities.push(activity);
                    res.locals.activities.push(activity);

                    req.user.save();

                    req.flash("success", "Comment Deleted Successfully!")
                    res.redirect("/campgrounds/" + req.params.slug)
                }
            })
        }
    })
})


module.exports = router;
