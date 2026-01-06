const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    trades: [{ type: mongoose.Schema.Types.ObjectId, ref: "Trade" }],
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", userSchema);