const axios = require('axios');
const { GOLD_API_KEY, GOLD_API_BASE_URL, GOLD_GRAMS_PER_OUNCE } = require('../config/constants');

// ========== GET GOLD PRICE ==========
async function getGoldPrice() {
    if (!GOLD_API_KEY) {
        throw new Error('GOLD_API_KEY not configured');
    }

    const response = await axios.get(`${GOLD_API_BASE_URL}?api_key=${GOLD_API_KEY}`);
    const pricePerOunce = response.data.price;
    const goldPerGram = pricePerOunce / GOLD_GRAMS_PER_OUNCE;

    return {
        price_per_ounce: pricePerOunce,
        price_per_gram: goldPerGram,
        currency: 'USD',
        timestamp: new Date().toISOString()
    };
}

// ========== GET PRX PRICE ==========
async function getPRXPrice() {
    const gold = await getGoldPrice();
    const prxPrice = gold.price_per_gram / 100;

    return {
        prx_usd: prxPrice,
        prx_gold_grams: 0.01,
        gold_per_gram: gold.price_per_gram,
        gold_per_ounce: gold.price_per_ounce,
        timestamp: gold.timestamp
    };
}

// ========== CONVERT PRX TO GOLD ==========
function prxToGold(prxAmount, goldPerGram) {
    return prxAmount * 0.01;
}

// ========== CONVERT GOLD TO PRX ==========
function goldToPRX(goldGrams) {
    return goldGrams * 100;
}

// ========== CONVERT PRX TO USD ==========
function prxToUSD(prxAmount, prxPrice) {
    return prxAmount * prxPrice;
}

// ========== CONVERT USD TO PRX ==========
function usdToPRX(usdAmount, prxPrice) {
    if (prxPrice <= 0) {
        throw new Error('Invalid PRX price');
    }
    return usdAmount / prxPrice;
}

// ========== GET PRICE HISTORY ==========
async function getPriceHistory(period = '24h') {
    // Placeholder untuk harga historis
    // Nanti bisa integrasi dengan API eksternal
    return {
        period,
        data: [],
        message: 'Historical data not yet available'
    };
}

module.exports = {
    getGoldPrice,
    getPRXPrice,
    prxToGold,
    goldToPRX,
    prxToUSD,
    usdToPRX,
    getPriceHistory
};
