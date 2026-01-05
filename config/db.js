const mongoose = require("mongoose");
module.exports = function () {
    mongoose.connect("mongodb + srv://niyitanganihonor:honore@cluster0.wskc7ct.mongodb.net/?appName=Cluster0")
        .then(() => console.log("Connected to MongoDB"))
        .catch((err) => console.log(err));
}