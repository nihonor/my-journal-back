const express = require('express');
const router = express.Router();
const tradeController = require('../controllers/tradeController');
const auth = require('../middleware/auth');

router.use(auth); // Protect all trade routes

router.post('/', tradeController.createTrade);
router.get('/', tradeController.getTrades);
router.get('/stats', tradeController.getStats); // Stats before :id to prevent conflict
router.get('/:id', tradeController.getTradeById);
router.put('/:id', tradeController.updateTrade);
router.delete('/:id', tradeController.deleteTrade);

module.exports = router;
