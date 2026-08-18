const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// ========== CONFIGURATION (TANPA FALLBACK) ==========
if (!process.env.SUPABASE_URL) {
    throw new Error('SUPABASE_URL wajib diisi');
}

if (!process.env.SUPABASE_KEY) {
    throw new Error('SUPABASE_KEY wajib diisi');
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

// ========== CREATE CLIENT ==========
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
    },
    db: {
        schema: 'public'
    },
    global: {
        headers: {
            'x-prismex-core': '1.0.0'
        }
    }
});

// ========== UTILITY: GENERATE RANDOM ==========
function generateRandomBytes(size = 32) {
    return crypto.randomBytes(size).toString('hex');
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

// ========== UTILITY: MONETARY ==========
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

// ========== UTILITY: AUTH ==========
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

    if (!adminSecret) {
        return res.status(403).json({ success: false, error: 'Missing admin secret' });
    }

    const adminHash = crypto.createHash('sha256').update(adminSecret).digest('hex');
    const expectedHash = crypto.createHash('sha256').update(process.env.ADMIN_SECRET || '').digest('hex');

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
    const expectedOpHash = crypto.createHash('sha256').update(process.env.OPERATOR_SECRET || '').digest('hex');

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

// ========== UTILITY: LEDGER ==========
async function getBalance(userId, protocol) {
    const { data } = await supabase
        .from('balances')
        .select('*')
        .eq('user_id', userId)
        .eq('protocol', protocol)
        .single();

    return data ? Number(data.amount) : 0;
}

async function getStatement(userId, limit = 100) {
    const { data } = await supabase
        .from('transactions')
        .select('*')
        .or(`sender_user_id.eq.${userId},receiver_user_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .limit(limit);

    return data || [];
}

async function recordTransaction(txData) {
    const { error } = await supabase
        .from('transactions')
        .insert([txData]);

    if (error) {
        throw new Error(error.message);
    }

    return true;
}

async function updateBalance(userId, protocol, amountUnits) {
    const currentBalance = await getBalance(userId, protocol);

    const { error } = await supabase
        .from('balances')
        .upsert([{
            user_id: userId,
            protocol,
            amount: currentBalance + amountUnits,
            updated_at: new Date().toISOString()
        }], {
            onConflict: 'user_id,protocol'
        });

    if (error) {
        throw new Error(error.message);
    }

    return true;
}

// ========== EXPORT ==========
module.exports = {
    supabase,
    generateRandomBytes,
    generateSalt,
    hashSecret,
    generateToken,
    generateId,
    generateAccountNumber,
    toUnits,
    fromUnits,
    calculateFees,
    authUser,
    authAdmin,
    authOperator,
    getBalance,
    getStatement,
    recordTransaction,
    updateBalance
};