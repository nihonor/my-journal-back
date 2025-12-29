const mongoose = require("mongoose");

const tradeSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    pair: { type: String, required: true }, // e.g., EURUSD, BTCUSD
    type: { type: String, enum: ['Long', 'Short'], required: true },
    lot_size: { type: Number, required: true },
    entry_price: { type: Number, required: true },
    exit_price: { type: Number },
    stop_loss: { type: Number },
    take_profit: { type: Number },
    profit_loss: { type: Number }, // Calculated P/L
    risk_reward: { type: Number }, // Calculated R:R
    notes: { type: String },
    status: { type: String, enum: ['Open', 'Closed', 'Pending'], default: 'Open' },
    trade_date: { type: Date, default: Date.now },
}, { timestamps: true }); // Adds createdAt and updatedAt automatically

module.exports = mongoose.model("Trade", tradeSchema);