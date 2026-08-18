const express = require('express');
const router = express.Router();
const { supabase, authOperator } = require('../config/supabase');

// ========== REGISTER OPERATOR ==========
router.post('/register', async (req, res) => {
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

// ========== TASKS (PAKAI req.operator) ==========
router.post('/task', authOperator, async (req, res) => {
    const operatorId = req.operator.operator_id;

    const { data: txs } = await supabase
        .from('transactions')
        .select('tx_id, protocol, amount, status, created_at')
        .eq('operator_id', operatorId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(50);

    res.json({ success: true, tasks: txs || [] });
});

// ========== PUBLIC LIST (AMAN) ==========
router.get('/list', async (req, res) => {
    const { data: operators } = await supabase
        .from('operators')
        .select('operator_id, protocol, region, status, total_transactions')
        .order('created_at', { ascending: false });

    res.json({ success: true, operators: operators || [] });
});

// ========== PUBLIC STATS (AMAN) ==========
router.get('/stats/:operator_id', async (req, res) => {
    const { operator_id } = req.params;

    const { data: op } = await supabase
        .from('operators')
        .select('operator_id, protocol, region, status, total_transactions')
        .eq('operator_id', operator_id)
        .single();

    if (!op) {
        return res.status(404).json({ success: false, error: 'Operator not found' });
    }

    res.json({ success: true, operator: op });
});

module.exports = router;
