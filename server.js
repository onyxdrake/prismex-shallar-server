const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const axios = require('axios');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
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

const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 300,
    message: { success: false, error: 'Too many requests' }
});
app.use('/api/', apiLimiter);

// ========== KRIPTOGRAFI ==========
function generateRandomSecret() {
    return crypto.randomBytes(32).toString('hex');
}

function generateSalt() {
    return crypto.randomBytes(16).toString('hex');
}

function hashSecret(secret, salt) {
    return crypto.createHash('sha256').update(salt + secret).digest('hex');
}

function generateToken() {
    return crypto.randomBytes(48).toString('hex');
}

function generateId(prefix) {
    return `${prefix}-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
}

function generateAccountNumber() {
    return `PX-${Math.floor(100000000 + Math.random() * 900000000)}`;
}

// ========== MONETARY CONVERSION ==========
const PRX_DECIMALS = 6;
const PRX_UNIT = Math.pow(10, PRX_DECIMALS);

function toUnits(amount) {
    return Math.round(parseFloat(amount) * PRX_UNIT);
}

function fromUnits(units) {
    return units / PRX_UNIT;
}

function calculateFees(units) {
    const totalFee = Math.floor(units * 0.02);
    const operatorFee = Math.floor(totalFee * 0.25);
    const treasuryFee = totalFee - operatorFee;
    const netAmount = units - totalFee;
    return { totalFee, operatorFee, treasuryFee, netAmount };
}

// ========== AUTH MIDDLEWARE ==========
async function authUser(req, res, next) {
    const userId = req.headers['x-user-id'];
    const authToken = req.headers['x-auth-token'];

    if (!userId || !authToken) {
        return res.status(401).json({ success: false, error: 'Missing credentials' });
    }

    const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (!user) {
        return res.status(401).json({ success: false, error: 'User not found' });
    }

    const hashed = hashSecret(authToken, user.salt);
    if (hashed !== user.token_hash) {
        return res.status(403).json({ success: false, error: 'Invalid token' });
    }

    if (user.status !== 'active') {
        return res.status(403).json({ success: false, error: 'Account frozen' });
    }

    req.user = user;
    next();
}

async function authAdmin(req, res, next) {
    const adminSecret = req.headers['x-admin-secret'];
    const adminHash = crypto.createHash('sha256').update(adminSecret || '').digest('hex');
    const expectedHash = crypto.createHash('sha256').update(ADMIN_SECRET).digest('hex');

    if (adminHash !== expectedHash) {
        return res.status(403).json({ success: false, error: 'Invalid admin secret' });
    }
    next();
}

async function authOperator(req, res, next) {
    const { operator_id, operator_secret } = req.body;

    if (!operator_id || !operator_secret) {
        return res.status(401).json({ success: false, error: 'Missing operator credentials' });
    }

    const operatorHash = crypto.createHash('sha256').update(operator_secret).digest('hex');
    const expectedOpHash = crypto.createHash('sha256').update(OPERATOR_SECRET).digest('hex');

    if (operatorHash !== expectedOpHash) {
        return res.status(403).json({ success: false, error: 'Invalid operator secret' });
    }

    const { data: op } = await supabase
        .from('operators')
        .select('*')
        .eq('operator_id', operator_id)
        .single();

    if (!op || op.status !== 'active') {
        return res.status(403).json({ success: false, error: 'Operator not active' });
    }

    req.operator = op;
    next();
}

// ========== ROOT ==========
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Prismex Digital Gold Currency API',
        version: '2.0.0',
        architecture: 'Ledger-based',
        timestamp: new Date().toISOString()
    });
});

// ========== HEALTH ==========
app.get('/api/health', async (req, res) => {
    const { data: ops } = await supabase.from('operators').select('*').limit(5);
    res.json({
        success: true,
        message: 'Prismex API healthy',
        uptime: process.uptime(),
        operators: ops ? ops.length : 0,
        timestamp: new Date().toISOString()
    });
});

// ========== REGISTER ==========
app.post('/api/auth/register', async (req, res) => {
    const { user_id, telegram_id, wallet_address, secret } = req.body;

    if (!user_id || !secret) {
        return res.status(400).json({ success: false, error: 'user_id and secret required' });
    }

    const salt = generateSalt();
    const token = generateToken();
    const tokenHash = hashSecret(token, salt);
    const accountNumber = generateAccountNumber();

    const { data: existing } = await supabase
        .from('users')
        .select('user_id')
        .eq('user_id', user_id)
        .single();

    if (existing) {
        return res.status(409).json({ success: false, error: 'User already exists' });
    }

    const { error } = await supabase
        .from('users')
        .insert([{
            user_id,
            telegram_id: telegram_id || null,
            wallet_address: wallet_address || null,
            salt,
            token_hash: tokenHash,
            account_number: accountNumber,
            status: 'active',
            created_at: new Date().toISOString()
        }]);

    if (error) {
        return res.status(400).json({ success: false, error: error.message });
    }

    res.json({
        success: true,
        message: 'Account created',
        user_id,
        account_number: accountNumber,
        auth_token: token
    });
});

// ========== LOGIN ==========
app.post('/api/auth/login', async (req, res) => {
    const { user_id, secret } = req.body;

    if (!user_id || !secret) {
        return res.status(400).json({ success: false, error: 'user_id and secret required' });
    }

    const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', user_id)
        .single();

    if (!user) {
        return res.status(401).json({ success: false, error: 'User not found' });
    }

    const hashed = hashSecret(secret, user.salt);
    if (hashed !== user.secret_hash) {
        return res.status(403).json({ success: false, error: 'Invalid secret' });
    }

    const token = generateToken();
    const tokenHash = hashSecret(token, user.salt);

    await supabase
        .from('users')
        .update({ token_hash: tokenHash })
        .eq('user_id', user_id);

    res.json({
        success: true,
        message: 'Login successful',
        user_id,
        account_number: user.account_number,
        auth_token: token
    });
});

// ========== BALANCE ==========
app.get('/api/wallet/balance', authUser, async (req, res) => {
    const userId = req.user.user_id;

    const { data: balances } = await supabase
        .from('balances')
        .select('*')
        .eq('user_id', userId);

    res.json({ success: true, balances: balances || [] });
});

// ========== STATEMENT ==========
app.get('/api/wallet/statement', authUser, async (req, res) => {
    const userId = req.user.user_id;

    const { data: txs } = await supabase
        .from('transactions')
        .select('*')
        .or(`sender_user_id.eq.${userId},receiver_user_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .limit(100);

    res.json({ success: true, transactions: txs || [] });
});

// ========== TRANSFER (ATOMIC) ==========
app.post('/api/transfer/p2p', authUser, async (req, res) => {
    const sender = req.user.user_id;
    const { receiver_user_id, amount, protocol, note } = req.body;

    if (!receiver_user_id || !amount || parseFloat(amount) <= 0) {
        return res.status(400).json({ success: false, error: 'Invalid transfer data' });
    }

    if (sender === receiver_user_id) {
        return res.status(400).json({ success: false, error: 'Cannot transfer to self' });
    }

    const amountUnits = toUnits(amount);
    const fees = calculateFees(amountUnits);
    const txId = generateId('TX');

    // ========== ATOMIC TRANSACTION ==========
    const { data: tx, error: txError } = await supabase
        .rpc('process_transfer', {
            p_tx_id: txId,
            p_sender: sender,
            p_receiver: receiver_user_id,
            p_protocol: protocol || 'PRX',
            p_amount: amountUnits,
            p_fee_total: fees.totalFee,
            p_fee_operator: fees.operatorFee,
            p_fee_treasury: fees.treasuryFee,
            p_net_amount: fees.netAmount,
            p_note: note || ''
        });

    if (txError) {
        return res.status(400).json({ success: false, error: txError.message });
    }

    res.json({
        success: true,
        message: 'Transfer successful',
        tx_id: txId,
        amount: fromUnits(amountUnits),
        net_amount: fromUnits(fees.netAmount),
        fee_total: fromUnits(fees.totalFee)
    });
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

// ========== STAKING ==========
app.post('/api/staking/stake', authUser, async (req, res) => {
    const userId = req.user.user_id;
    const { protocol, amount } = req.body;

    if (!amount || parseFloat(amount) <= 0) {
        return res.status(400).json({ success: false, error: 'Invalid stake amount' });
    }

    const amountUnits = toUnits(amount);

    const { error } = await supabase
        .rpc('process_stake', {
            p_user_id: userId,
            p_protocol: protocol || 'PRX',
            p_amount: amountUnits
        });

    if (error) {
        return res.status(400).json({ success: false, error: error.message });
    }

    res.json({ success: true, message: `Staked ${amount} ${protocol || 'PRX'}` });
});

app.post('/api/staking/unstake', authUser, async (req, res) => {
    const userId = req.user.user_id;
    const { protocol, amount } = req.body;

    if (!amount || parseFloat(amount) <= 0) {
        return res.status(400).json({ success: false, error: 'Invalid unstake amount' });
    }

    const amountUnits = toUnits(amount);

    const { error } = await supabase
        .rpc('process_unstake', {
            p_user_id: userId,
            p_protocol: protocol || 'PRX',
            p_amount: amountUnits
        });

    if (error) {
        return res.status(400).json({ success: false, error: error.message });
    }

    res.json({ success: true, message: `Unstaked ${amount} ${protocol || 'PRX'}` });
});

// ========== YIELD ==========
app.get('/api/staking/yield', authUser, async (req, res) => {
    const userId = req.user.user_id;

    const { data: stakes } = await supabase
        .from('stakes')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active');

    const totalUnits = stakes ? stakes.reduce((sum, s) => sum + Number(s.amount), 0) : 0;
    const yearlyUnits = totalUnits * 0.025;
    const dailyUnits = yearlyUnits / 365;

    res.json({
        success: true,
        total_staked: fromUnits(totalUnits),
        yearly_yield: fromUnits(yearlyUnits).toFixed(6),
        daily_yield: fromUnits(dailyUnits).toFixed(6),
        apy: '2.5%'
    });
});

// ========== OPERATOR ==========
app.post('/api/operator/register', async (req, res) => {
    const { operator_id, protocol, region, wallet_address } = req.body;

    if (!operator_id || !protocol || !region || !wallet_address) {
        return res.status(400).json({ success: false, error: 'Missing operator data' });
    }

    const { error } = await supabase
        .from('operators')
        .insert([{
            operator_id,
            protocol,
            region,
            wallet_address,
            status: 'pending',
            created_at: new Date().toISOString()
        }]);

    if (error) {
        return res.status(400).json({ success: false, error: error.message });
    }

    res.json({ success: true, message: 'Operator registered' });
});

app.post('/api/operator/task', authOperator, async (req, res) => {
    const { operator_id } = req.body;

    const { data: txs } = await supabase
        .from('transactions')
        .select('*')
        .eq('operator_id', operator_id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(50);

    res.json({ success: true, tasks: txs || [] });
});

// ========== ADMIN ==========
app.get('/api/admin/users', authAdmin, async (req, res) => {
    const { data: users } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

    res.json({ success: true, users: users || [] });
});

app.get('/api/admin/transactions', authAdmin, async (req, res) => {
    const { data: txs } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

    res.json({ success: true, transactions: txs || [] });
});

app.post('/api/admin/freeze', authAdmin, async (req, res) => {
    const { user_id } = req.body;

    const { error } = await supabase
        .from('users')
        .update({ status: 'frozen' })
        .eq('user_id', user_id);

    if (error) {
        return res.status(500).json({ success: false, error: error.message });
    }

    res.json({ success: true, message: 'User frozen' });
});

app.post('/api/admin/unfreeze', authAdmin, async (req, res) => {
    const { user_id } = req.body;

    const { error } = await supabase
        .from('users')
        .update({ status: 'active' })
        .eq('user_id', user_id);

    if (error) {
        return res.status(500).json({ success: false, error: error.message });
    }

    res.json({ success: true, message: 'User unfrozen' });
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
    console.log(`🚀 Prismex API v2 running on port ${PORT}`);
});