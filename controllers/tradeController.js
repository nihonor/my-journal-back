const Trade = require("../models/trade");

// Calculate P/L and Status helper
const calculateTradeData = (tradeData) => {
    let { entry_price, exit_price, type, lot_size } = tradeData;
    let profit_loss = 0;
    let status = tradeData.status || 'Open';

    if (exit_price) {
        // Simplified P/L calculation for Forex/Crypto (Standard lots assumption or raw diff)
        // Adjust multiplier based on asset class if needed. Here assuming standard CFDs: (Exit - Entry) * Lot * UnitSize
        // For simplicity, let's just do raw price difference * lot_size for now,
        // or just let user input P/L if they want. But goal says "profit/loss logic".
        // Let's assume a basic (Exit - Entry) * Lot_Size for Long, reversed for Short.

        const diff = type === 'Long' ? (exit_price - entry_price) : (entry_price - exit_price);
        profit_loss = diff * lot_size;
        status = 'Closed';
    }

    return { ...tradeData, profit_loss, status };
};

exports.createTrade = async (req, res) => {
    try {
        const tradeData = { ...req.body, userId: req.user._id }; // Assuming auth middleware adds user
        const processedData = calculateTradeData(tradeData);

        const trade = new Trade(processedData);
        await trade.save();
        res.status(201).json(trade);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.getTrades = async (req, res) => {
    try {
        const { page = 1, limit = 10, pair, type, status, startDate, endDate } = req.query;
        const query = { userId: req.user._id };

        if (pair) query.pair = pair;
        if (type) query.type = type;
        if (status) query.status = status;
        if (startDate || endDate) {
            query.trade_date = {};
            if (startDate) query.trade_date.$gte = new Date(startDate);
            if (endDate) query.trade_date.$lte = new Date(endDate);
        }

        const trades = await Trade.find(query)
            .sort({ trade_date: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const count = await Trade.countDocuments(query);

        res.json({
            trades,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getTradeById = async (req, res) => {
    try {
        const trade = await Trade.findOne({ _id: req.params.id, userId: req.user._id });
        if (!trade) return res.status(404).json({ error: "Trade not found" });
        res.json(trade);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateTrade = async (req, res) => {
    try {
        let updateData = req.body;

        // If critical fields change, recalculate P/L
        if (updateData.entry_price || updateData.exit_price || updateData.lot_size || updateData.type) {
            // We need current values if not all are provided, so might need to fetch first or merge.
            // For simplicity, treating put/patch carefully.
            // If this is a partial update, we might need to fetch the existing trade to recalc correctly.
            const existingTrade = await Trade.findOne({ _id: req.params.id, userId: req.user._id });
            if (!existingTrade) return res.status(404).json({ error: "Trade not found" });

            const mergedData = { ...existingTrade.toObject(), ...updateData };
            updateData = calculateTradeData(mergedData);
        }

        const trade = await Trade.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            updateData,
            { new: true }
        );

        if (!trade) return res.status(404).json({ error: "Trade not found" });
        res.json(trade);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.deleteTrade = async (req, res) => {
    try {
        const trade = await Trade.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
        if (!trade) return res.status(404).json({ error: "Trade not found" });
        res.json({ message: "Trade deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getStats = async (req, res) => {
    try {
        const userId = req.user._id;

        const stats = await Trade.aggregate([
            { $match: { userId: userId, status: 'Closed' } },
            {
                $group: {
                    _id: null,
                    totalTrades: { $sum: 1 },
                    totalProfit: { $sum: "$profit_loss" },
                    winningTrades: {
                        $sum: { $cond: [{ $gt: ["$profit_loss", 0] }, 1, 0] }
                    },
                    losingTrades: {
                        $sum: { $cond: [{ $lt: ["$profit_loss", 0] }, 1, 0] }
                    }
                }
            }
        ]);

        const result = stats[0] || { totalTrades: 0, totalProfit: 0, winningTrades: 0, losingTrades: 0 };
        const winRate = result.totalTrades > 0 ? (result.winningTrades / result.totalTrades) * 100 : 0;

        // Daily P/L for charts
        const dailyPL = await Trade.aggregate([
            { $match: { userId: userId, status: 'Closed' } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$trade_date" } },
                    total: { $sum: "$profit_loss" }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json({
            ...result,
            winRate,
            dailyPL
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
