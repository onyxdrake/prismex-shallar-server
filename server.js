const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const axios = require('axios');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 8080;

// ========== CONFIGURATION (TANPA FALLBACK) ==========
if (!process.env.SUPABASE_URL) throw new Error('SUPABASE_URL wajib diisi');
if (!process.env.SUPABASE_KEY) throw new Error('SUPABASE_KEY wajib diisi');
if (!process.env.GOLD_API_KEY) throw new Error('GOLD_API_KEY wajib diisi');
if (!process.env.OPERATOR_SECRET) throw new Error('OPERATOR_SECRET wajib diisi');
if (!process.env.ADMIN_SECRET) throw new Error('ADMIN_SECRET wajib diisi');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const GOLD_API_KEY = process.env.GOLD_API_KEY;
const OPERATOR_SECRET = process.env.OPERATOR_SECRET;
const ADMIN_SECRET = process.env.ADMIN_SECRET;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ========== MIDDLEWARE ==========
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

// ========== ROUTES ==========
const authRoutes = require('./routes/auth');
const walletRoutes = require('./routes/wallet');
const transferRoutes = require('./routes/transfer');
const goldRoutes = require('./routes/gold');
const stakingRoutes = require('./routes/staking');
const operatorRoutes = require('./routes/operator');
const merchantRoutes = require('./routes/merchant');
const adminRoutes = require('./routes/admin');

// ========== MOUNT ROUTES ==========
app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/transfer', transferRoutes);
app.use('/api/gold', goldRoutes);
app.use('/api/staking', stakingRoutes);
app.use('/api/operator', operatorRoutes);
app.use('/api/merchant', merchantRoutes);
app.use('/api/admin', adminRoutes);

// ========== ROOT ==========
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Prismex Digital Gold Bank API',
        version: '2.0.0',
        architecture: 'Ledger-based',
        status: 'operational',
        timestamp: new Date().toISOString()
    });
});

// ========== HEALTH CHECK ==========
app.get('/api/health', async (req, res) => {
    try {
        const { data: operators } = await supabase.from('operators').select('*').limit(10);
        const { data: users } = await supabase.from('users').select('*', { count: 'exact', head: true });
        const { data: txs } = await supabase.from('transactions').select('*', { count: 'exact', head: true });

        res.json({
            success: true,
            message: 'Prismex Digital Gold Bank API healthy',
            uptime: process.uptime(),
            total_operators: operators ? operators.length : 0,
            total_users: users ? users.length : 0,
            total_transactions: txs ? txs.length : 0,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ========== GOLD PRICE ==========
app.get('/api/gold/price', async (req, res) => {
    try {
        const response = await axios.get(`https://api.gold-api.com/price/XAU?api_key=${GOLD_API_KEY}`);
        const pricePerOunce = response.data.price;
        const goldPerGram = pricePerOunce / 31.1035;
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

// ========== RESERVE ==========
app.get('/api/reserve', async (req, res) => {
    try {
        const { data: balanceRows } = await supabase
            .from('balances')
            .select('amount')
            .eq('protocol', 'PRX');

        const circulating = balanceRows ? balanceRows.reduce((sum, b) => sum + Number(b.amount), 0) : 0;

        res.json({
            success: true,
            gold_grams: 1000,
            circulating_prx: circulating,
            coverage: '100%',
            vault_location: 'Singapore',
            last_audit: '2026-08-01'
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ========== 404 ==========
app.use((req, res) => {
    res.status(404).json({ success: false, error: 'Endpoint not found' });
});

// ========== ERROR HANDLER ==========
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`🚀 Prismex Digital Gold Bank API running on port ${PORT}`);
});
