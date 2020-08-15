var mongoose = require("mongoose")

//! step 3 : schema setup
var commentSchema = new mongoose.Schema({
    text: String,
    createdAt: { type: Date, default: Date.now },
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String,
        isAdmin  : Boolean
    }
})

//! step 4 : compile into a model
var Comment = mongoose.model("Comment", commentSchema)

module.exports = Comment;