const express = require('express');
const router = express.Router();
const axios = require('axios');
const { GOLD_API_KEY } = require('../config/constants');
const { GOLD_API_BASE_URL, GOLD_GRAMS_PER_OUNCE } = require('../config/constants');

// ========== GET GOLD PRICE ==========
router.get('/price', async (req, res) => {
    try {
        if (!GOLD_API_KEY) {
            return res.status(500).json({ success: false, error: 'GOLD_API_KEY not configured' });
        }

        const response = await axios.get(`${GOLD_API_BASE_URL}?api_key=${GOLD_API_KEY}`);
        const pricePerOunce = response.data.price;
        const goldPerGram = pricePerOunce / GOLD_GRAMS_PER_OUNCE;
        const prxPrice = goldPerGram / 100;

        res.json({
            success: true,
            gold_per_ounce: pricePerOunce,
            gold_per_gram: goldPerGram.toFixed(6),
            prx_usd: prxPrice.toFixed(6),
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Failed to fetch gold price' });
    }
});

// ========== GET GOLD PRICE IN GRAMS ==========
router.get('/gram', async (req, res) => {
    try {
        if (!GOLD_API_KEY) {
            return res.status(500).json({ success: false, error: 'GOLD_API_KEY not configured' });
        }

        const response = await axios.get(`${GOLD_API_BASE_URL}?api_key=${GOLD_API_KEY}`);
        const pricePerOunce = response.data.price;
        const goldPerGram = pricePerOunce / GOLD_GRAMS_PER_OUNCE;

        res.json({
            success: true,
            gold_per_gram: goldPerGram.toFixed(6),
            currency: 'USD',
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Failed to fetch gold price' });
    }
});

// ========== GET PRX REFERENCE PRICE ==========
router.get('/prx', async (req, res) => {
    try {
        if (!GOLD_API_KEY) {
            return res.status(500).json({ success: false, error: 'GOLD_API_KEY not configured' });
        }

        const response = await axios.get(`${GOLD_API_BASE_URL}?api_key=${GOLD_API_KEY}`);
        const pricePerOunce = response.data.price;
        const goldPerGram = pricePerOunce / GOLD_GRAMS_PER_OUNCE;
        const prxPrice = goldPerGram / 100;

        res.json({
            success: true,
            prx_usd: prxPrice.toFixed(6),
            prx_gold_grams: '0.01',
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Failed to fetch PRX price' });
    }
});

// ========== GOLD HISTORY (PLACEHOLDER) ==========
router.get('/history', async (req, res) => {
    res.json({
        success: true,
        message: 'Historical gold price data',
        data: [],
        note: 'Historical data will be available after integration with external provider'
    });
});

module.exports = router;
