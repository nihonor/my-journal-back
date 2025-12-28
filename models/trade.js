const mongoose = require("mongoose");
const tradeSchema = new mongoose.Schema({
    userId: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }],
    pair: { type: String, required: true },
    type: { type: String, required: true },
    lot_size: { type: Number, required: true },
    entry_price: { type: Number, required: true },
    exit_price: { type: Number, required: true },
    stop_loss: { type: Number, required: true },
    take_profit: { type: Number, required: true },
    profit_loss: { type: Number, required: true },
    risk_percent: { type: Number, required: true },
    trade_date: { type: Date, required: true },
    created_at: { type: Date, required: true },


});