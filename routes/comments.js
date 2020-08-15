var express = require("express")
//? to access :id even after shortening url
var router = express.Router({ mergeParams: true })
var middleware = require("../middleware")
const { isLoggedIn, isPaid ,isNotBlocked } = require("../middleware");


var Campground = require("../models/campground")
var Comment = require("../models/comments")


// Apply to all routes
router.use(isLoggedIn, isPaid, isNotBlocked)


//! COMMENTS ROUTE
//? NEW
router.get("/new",  function (req, res) {
    //find the campground with given id
    Campground.findById(req.params.id).populate("comments").exec(function (err, foundCampground) {
        //render show tempate
        res.render("comments/new.ejs", { campground: foundCampground })
    })
})

//? CREATE
router.post("/",  function (req, res) {
    //looking up for campground using ID
    Campground.findById(req.params.id, function (err, campground) {
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
                    comment.save();

                    campground.comments.push(comment);
                    campground.save()

                    var activity = {
                        action : "comment",
                        campground:{
                            name: campground.name,
                            id: campground.id,
                            author: campground.author.username
                        } ,
                        text: comment.text
                    }
    
                    req.user.activities.push(activity);
                    req.user.save();
    
                    console.log("zxzxz********");
                    console.log(req.user);
    

                    res.redirect("/campgrounds/" + campground._id);
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
            res.render("comments/edit.ejs", { campgroundID: req.params.id, comment: foundComment })

        }
    })
})

//? UPDATE
router.put("/:comment_id", middleware.checkCommentOwnership, function (req, res) {

    Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function (err, updatedComment) {
        if (err) {
            res.redirect("back")
        } else {
            res.redirect("/campgrounds/" + req.params.id)
        }
    })
})

//? DESTROY
router.delete("/:comment_id", middleware.checkCommentOwnership, function (req, res) {

    Comment.findByIdAndRemove(req.params.comment_id, function (err) {
        if (err) {
            // alert("cannot delete")
            res.redirect("back")
        } else {
            req.flash("success", "Comment Deleted Successfully!")
            res.redirect("/campgrounds/" + req.params.id)
        }
    })
})


module.exports = router;
