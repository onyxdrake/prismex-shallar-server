const { supabase, hashSecret } = require('../config/supabase');

async function authUser(req, res, next) {
    try {
        const userId = req.headers['x-user-id'];
        const authToken = req.headers['x-auth-token'];

        if (!userId || !authToken) {
            return res.status(401).json({ success: false, error: 'Missing credentials' });
        }

        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error || !user) {
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
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}

async function authAdmin(req, res, next) {
    try {
        const adminSecret = req.headers['x-admin-secret'];

        if (!adminSecret) {
            return res.status(403).json({ success: false, error: 'Missing admin secret' });
        }

        const crypto = require('crypto');
        const adminHash = crypto.createHash('sha256').update(adminSecret).digest('hex');
        const expectedHash = crypto.createHash('sha256').update(process.env.ADMIN_SECRET || '').digest('hex');

        if (adminHash !== expectedHash) {
            return res.status(403).json({ success: false, error: 'Invalid admin secret' });
        }

        next();
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}

async function authOperator(req, res, next) {
    try {
        const { operator_id, operator_secret } = req.body;

        if (!operator_id || !operator_secret) {
            return res.status(401).json({ success: false, error: 'Missing operator credentials' });
        }

        const crypto = require('crypto');
        const operatorHash = crypto.createHash('sha256').update(operator_secret).digest('hex');
        const expectedOpHash = crypto.createHash('sha256').update(process.env.OPERATOR_SECRET || '').digest('hex');

        if (operatorHash !== expectedOpHash) {
            return res.status(403).json({ success: false, error: 'Invalid operator secret' });
        }

        const { data: op, error } = await supabase
            .from('operators')
            .select('*')
            .eq('operator_id', operator_id)
            .single();

        if (error || !op) {
            return res.status(401).json({ success: false, error: 'Operator not found' });
        }

        if (op.status !== 'active') {
            return res.status(403).json({ success: false, error: 'Operator not active' });
        }

        req.operator = op;
        next();
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}

module.exports = { authUser, authAdmin, authOperator };
