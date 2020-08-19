var mongoose = require("mongoose")

//! step 3 : schema setup
var campgroundSchema = new mongoose.Schema({
    name: String,
    price: Number,
    images: [{
        url : String,
        public_id: String
    }],
    description: String,
    location: String,
    lat: Number,
    lng: Number,
    createdAt: { type: Date, default: Date.now },
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String,
        isAdmin : Boolean
    },
    comments: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment"
        }
    ]
})

//! step 4 : compile into a model
var Campground = mongoose.model("Campground", campgroundSchema)

module.exports = Campground;