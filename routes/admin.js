const express = require('express');
const router = express.Router();
const { supabase, authAdmin } = require('../config/supabase');

// ========== GET USERS ==========
router.get('/users', authAdmin, async (req, res) => {
    try {
        const { data: users, error } = await supabase
            .from('users')
            .select('user_id, account_number, status, created_at')
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) {
            return res.status(500).json({ success: false, error: error.message });
        }

        res.json({ success: true, users: users || [] });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ========== GET TRANSACTIONS ==========
router.get('/transactions', authAdmin, async (req, res) => {
    try {
        const { data: txs, error } = await supabase
            .from('transactions')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) {
            return res.status(500).json({ success: false, error: error.message });
        }

        res.json({ success: true, transactions: txs || [] });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ========== FREEZE USER ==========
router.post('/freeze', authAdmin, async (req, res) => {
    try {
        const { user_id } = req.body;

        if (!user_id) {
            return res.status(400).json({ success: false, error: 'user_id required' });
        }

        const { error } = await supabase
            .from('users')
            .update({ status: 'frozen', updated_at: new Date().toISOString() })
            .eq('user_id', user_id);

        if (error) {
            return res.status(500).json({ success: false, error: error.message });
        }

        res.json({ success: true, message: `User ${user_id} frozen` });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ========== UNFREEZE USER ==========
router.post('/unfreeze', authAdmin, async (req, res) => {
    try {
        const { user_id } = req.body;

        const { error } = await supabase
            .from('users')
            .update({ status: 'active', updated_at: new Date().toISOString() })
            .eq('user_id', user_id);

        if (error) {
            return res.status(500).json({ success: false, error: error.message });
        }

        res.json({ success: true, message: `User ${user_id} unfrozen` });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ========== ACTIVATE OPERATOR ==========
router.post('/activate-operator', authAdmin, async (req, res) => {
    try {
        const { operator_id } = req.body;

        const { error } = await supabase
            .from('operators')
            .update({ status: 'active' })
            .eq('operator_id', operator_id);

        if (error) {
            return res.status(500).json({ success: false, error: error.message });
        }

        res.json({ success: true, message: `Operator ${operator_id} activated` });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ========== ACTIVATE MERCHANT ==========
router.post('/activate-merchant', authAdmin, async (req, res) => {
    try {
        const { merchant_id } = req.body;

        const { error } = await supabase
            .from('merchants')
            .update({ status: 'active' })
            .eq('merchant_id', merchant_id);

        if (error) {
            return res.status(500).json({ success: false, error: error.message });
        }

        res.json({ success: true, message: `Merchant ${merchant_id} activated` });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ========== SYSTEM STATS ==========
router.get('/stats', authAdmin, async (req, res) => {
    try {
        const { data: users } = await supabase.from('users').select('*', { count: 'exact', head: true });
        const { data: txs } = await supabase.from('transactions').select('*', { count: 'exact', head: true });
        const { data: operators } = await supabase.from('operators').select('*', { count: 'exact', head: true });
        const { data: merchants } = await supabase.from('merchants').select('*', { count: 'exact', head: true });

        res.json({
            success: true,
            total_users: users ? users.length : 0,
            total_transactions: txs ? txs.length : 0,
            total_operators: operators ? operators.length : 0,
            total_merchants: merchants ? merchants.length : 0
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
