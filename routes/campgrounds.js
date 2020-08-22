var express = require("express")
var router = express.Router()
var Campground = require("../models/campground")
var middleware = require("../middleware")

var NodeGeocoder = require('node-geocoder');
const { isLoggedIn, isPaid , isNotBlocked} = require("../middleware");
 
var options = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null
};
 
var geocoder = NodeGeocoder(options);


// CLOUDINARY FOR ADDING IMAGE
var multer = require('multer');
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    // if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
    //     return cb(new Error('Only image files are allowed!'), false);
    // }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter})

var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: 'rakmo33', 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});



// Apply to all routes
// router.use(isLoggedIn, isPaid)

//? INDEX route : show all campgrounds
router.get("/", function (req, res) {

    var noMatch = null;

    if(req.query.paid){
        res.locals.success = "Payment Successful, Welcome !"
    }

    // if(req.user.username === "Rakmo33"){
    //     console.log("GOD")
    //     req.user.isAdmin = true;
    //     req.user.save();
    //     console.log(req.user.isAdmin)
    // }

    if(req.query.searchCampground){

        const regex = new RegExp(escapeRegex(req.query.searchCampground), 'gi');
        // Get all campgrounds from DB
        Campground.find({name: regex}, function(err, allCampgrounds){
           if(err){
               console.log(err);
           } else {
              if(allCampgrounds.length < 1) {
                  noMatch = `No campgrounds match "${req.query.searchCampground}", please try again.`;
              }
              if(allCampgrounds.length > 0){
                noMatch = `Campgrounds matching your search : "${req.query.searchCampground}"`;
            }
              res.render("campgrounds/index.ejs",{campgrounds:allCampgrounds, noMatch: noMatch});
           }
        });

    }else{

        Campground.find({}, function (err, allCampgrounds) {
            //! Current user id and username is always contained in req.user
            res.render("campgrounds/index.ejs", { campgrounds: allCampgrounds,noMatch: noMatch, currentUser: req.user, page: 'campgrounds' })
        })
    }

})

//?  NEW route : display form for new campground
router.get("/new",isLoggedIn, isPaid,isNotBlocked, function (req, res) {
    res.render("campgrounds/new.ejs")
})

//? CREATE route : add new campground to database
router.post("/",isLoggedIn, isPaid,isNotBlocked, upload.array('images'), function (req, res) {

    var name = req.body.name
    var price = req.body.price
    var description = req.body.description
    var author= {
            id: req.user._id,
            username: req.user.username,
            isAdmin: req.user.isAdmin
        }
    var images = [];
  

    geocoder.geocode(req.body.location, async function (err, data) {
        if (err || !data.length) {
          req.flash('error', err.message);
          return res.redirect('back');
        }
        var lat = data[0].latitude;
        var lng = data[0].longitude;
        var location = data[0].formattedAddress;

    try{ 
        for (const file of req.files){
            // console.log("Files :" + req.files);
            if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
                req.flash("error", "File format not supported! Please upload only png/jpg/jpeg files.");
                return res.redirect("back");
            }
            else if (req.files.length > 5) {
                
                req.flash("error", "Maximum 5 Images can be uploaded!");
                return res.redirect("back");
            }
            let image = await cloudinary.v2.uploader.upload(file.path);
            images.push({
                url : image.secure_url,
                public_id : image.public_id
            })
        }    
        
    }catch(err){
        req.flash("error", err.message);
        return res.redirect("back");
    }   
         
    
            var newCampground = {name: name,images : images, price: price, description: description, author:author, location: location, lat: lat, lng: lng};

           
            Campground.create(newCampground, function (err, newlyCreated) {
            
                if(err){
    
                    req.flash('error', err.message);
                    return res.redirect('back');
                } 
                else {
    
                    //redirect back to campgrounds page
                    var activity = {
                        action : "post",
                        campground : {
                            name : newlyCreated.name,
                            id: newlyCreated.id,
                            author: newlyCreated.author.username
                        },
                        actor : req.user.username
                    }
    
                    req.user.activities.push(activity);
                    req.user.save();
    
                    res.redirect("/campgrounds");
                }
            })


       

        

        



    })

})

//? SHOW route : shows details of a single campground
// * MUST COME AT LAST, OTHERWISE WORDS LIKE /new WILL BE CONSIDERED ID
router.get("/:id", function (req, res) {
    //find the campground with given id
    Campground.findById(req.params.id).populate("comments").exec(function (err, foundCampground) {
        
        if (err || !foundCampground) {
            req.flash("error", "Campground not found!")
            res.set('Content-Type', 'text/html')
            res.redirect('back')
        }
        //render show tempate
        res.render("campgrounds/show.ejs", { campground: foundCampground })
    })
})

//? EDIT FORM
router.get("/:id/edit",isLoggedIn, isPaid, middleware.checkCampgroundOwnership,isNotBlocked, function (req, res) {

    Campground.findById(req.params.id, function (err, foundCampground) {
        res.render("campgrounds/edit.ejs", { campground: foundCampground })
    })

})

//? UPDATE ROUTE
router.put("/:id", upload.array('images') , isLoggedIn, isPaid, middleware.checkCampgroundOwnership,isNotBlocked,  function (req, res) {
    geocoder.geocode(req.body.location,  function (err, data) {
        if (err || !data.length) {
          req.flash('error', err.message);
          return res.redirect('back');
        }

        var images  = [];
       
    
        Campground.findById(req.params.id, async function(err, campground){
            if(err){
                req.flash("error", err.message);
                res.redirect("back");
            } else {
                
                // if image is uploaded
                if(req.files){

                    try{

                            // deleteImages is an array of values from checkboxes and contains public_id of images as values
                        if(req.body.deleteImages && req.body.deleteImages.length){
                            for(const image of req.body.deleteImages){
                                // delete image from clouidinary
                                await cloudinary.v2.uploader.destroy(image);

                                // delete image from database
                              
                                var index = campground.images.findIndex(found => found.public_id === image);
                                campground.images.splice(index,1);
                            }
                        }

                        req.files.forEach(function(file){
                            if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
                                req.flash("error", "File format not supported! Please upload only png/jpg/jpeg files.");
                                return res.redirect("back");
                            }
                        })
                       
                        for (const file of req.files){
                           
                            let image = await cloudinary.v2.uploader.upload(file.path);
                            campground.images.push({
                                url : image.secure_url,
                                public_id : image.public_id
                            })
                        }    

                    }catch(err){
                        req.flash("error", err.message);
                        return res.redirect("back");
                    }           
                }

                campground.name = req.body.campground.name;
                campground.price = req.body.campground.price;
                campground.description = req.body.campground.description;
                campground.lat = data[0].latitude;
                campground.lng = data[0].longitude;
                campground.location = data[0].formattedAddress;

                var activity = {
                    action : "edit",
                    campground : {
                        name : campground.name,
                        id: campground.id,
                        author: campground.author.username
                    },
                    actor : req.user.username
                }

                req.user.activities.push(activity);
                req.user.save();


                campground.save();


                req.flash("success","Successfully Updated!");
                res.redirect("/campgrounds/" + campground._id);
            }
        });
      });
})

//? DESTROY
router.delete("/:id",isLoggedIn, isPaid, middleware.checkCampgroundOwnership,isNotBlocked, function (req, res) {
    Campground.findById(req.params.id, async function (err, campground) {

        if(err){
            req.flash("error", err.message);
            return res.redirect("back");
        }
        try{
            for ( const image of campground.images){
                await cloudinary.v2.uploader.destroy(image.public_id);
            }
            campground.remove();
            var activity = {
                action : "delete",
                campground : {
                    name : campground.name,
                    id: campground.id,
                    author: campground.author.username
                },
                actor : req.user.username
            }

            req.user.activities.push(activity);
            req.user.save();
            req.flash("success","Successfully Deleted!");
            res.redirect("/campgrounds");
        }catch(err){
            req.flash("error", err.message);
            return res.redirect("back");
        }
        
    })
})


function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};


module.exports = router;
