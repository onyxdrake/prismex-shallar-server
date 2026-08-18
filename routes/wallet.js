const express = require('express');
const router = express.Router();
const { supabase, authUser, getBalance, getStatement } = require('../config/supabase');

// ========== GET BALANCE ==========
router.get('/balance', authUser, async (req, res) => {
    try {
        const userId = req.user.user_id;

        const { data: balances, error } = await supabase
            .from('balances')
            .select('*')
            .eq('user_id', userId);

        if (error) {
            return res.status(500).json({ success: false, error: error.message });
        }

        res.json({
            success: true,
            balances: balances || []
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ========== GET STATEMENT ==========
router.get('/statement', authUser, async (req, res) => {
    try {
        const userId = req.user.user_id;
        const limit = parseInt(req.query.limit) || 100;

        const txs = await getStatement(userId, limit);

        res.json({
            success: true,
            transactions: txs
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ========== GET BALANCE BY PROTOCOL ==========
router.get('/balance/:protocol', authUser, async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { protocol } = req.params;

        const balance = await getBalance(userId, protocol);

        res.json({
            success: true,
            protocol,
            balance
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ========== GET DAILY LIMIT ==========
router.get('/limit', authUser, async (req, res) => {
    try {
        const userId = req.user.user_id;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { data: txs } = await supabase
            .from('transactions')
            .select('*')
            .eq('sender_user_id', userId)
            .gte('created_at', today.toISOString());

        const totalSent = txs ? txs.reduce((sum, tx) => sum + Number(tx.amount), 0) : 0;
        const dailyLimit = parseFloat(process.env.DAILY_LIMIT || '100000');
        const remaining = Math.max(0, dailyLimit - totalSent);

        res.json({
            success: true,
            daily_limit: dailyLimit,
            total_sent_today: totalSent,
            remaining
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ========== EXPORT STATEMENT ==========
router.get('/export', authUser, async (req, res) => {
    try {
        const userId = req.user.user_id;

        const { data: txs } = await supabase
            .from('transactions')
            .select('*')
            .or(`sender_user_id.eq.${userId},receiver_user_id.eq.${userId}`)
            .order('created_at', { ascending: false })
            .limit(500);

        const csv = [
            'tx_id,protocol,sender,receiver,amount,fee_operator,fee_treasury,status,created_at',
            ...(txs || []).map(tx =>
                `${tx.tx_id},${tx.protocol},${tx.sender_user_id},${tx.receiver_user_id},${tx.amount},${tx.fee_operator},${tx.fee_treasury},${tx.status},${tx.created_at}`
            )
        ].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=statement-${userId}.csv`);
        res.send(csv);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
