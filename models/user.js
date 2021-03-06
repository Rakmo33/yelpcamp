var mongoose = require("mongoose")
var passportLocalMongoose = require("passport-local-mongoose")

var userSchema = mongoose.Schema({
    username: String,
    firstName : String,
    lastName : String,
    avatar : {
        url : String,
        public_id: String
    },
    email : {type : String, unique : true},
    bio : {type : String, default : ""},
    password: String,
    isPaid  : {type : Boolean, default : false},
    isAdmin :  {type : Boolean, default: false},
    isBlocked : {type : Boolean, default : false},
    activities : [
        {
            action : String,
            actor : String,
            campground :{
                id: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Campground"
                },
                name: String,
                author: String
            },
            createdAt: { type: Date, default: Date.now },
            text: {type: String, default: ""}

        }
    ],
    resetPasswordToken : String,
    resetPasswordExpires : Date
})

userSchema.plugin(passportLocalMongoose);

var User = mongoose.model("User", userSchema)

module.exports = User;