const mongoose = require("mongoose");
module.exports = function () {
    mongoose.connect(process.env.MONGO_URI)
        .then(() => console.log("Connected to MongoDB"))
        .catch((err) => console.log(err));
}