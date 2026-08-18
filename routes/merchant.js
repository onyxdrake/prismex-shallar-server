const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { supabase, authUser, toUnits, fromUnits, calculateFees, generateId } = require('../config/supabase');

// ========== REGISTER MERCHANT ==========
router.post('/register', authUser, async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { merchant_name, business_type, city } = req.body;

        if (!merchant_name || !business_type || !city) {
            return res.status(400).json({ success: false, error: 'Missing merchant data' });
        }

        const merchantId = `MERCH-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

        const { error } = await supabase
            .from('merchants')
            .insert([{
                merchant_id: merchantId,
                user_id: userId,
                merchant_name,
                business_type,
                city,
                status: 'pending',
                created_at: new Date().toISOString()
            }]);

        if (error) {
            return res.status(400).json({ success: false, error: error.message });
        }

        res.json({
            success: true,
            message: 'Merchant registered',
            merchant_id: merchantId
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ========== PAY MERCHANT ==========
router.post('/pay', authUser, async (req, res) => {
    try {
        const payerId = req.user.user_id;
        const { merchant_id, amount, note } = req.body;

        if (!merchant_id || !amount || parseFloat(amount) <= 0) {
            return res.status(400).json({ success: false, error: 'Invalid payment data' });
        }

        const { data: merchant } = await supabase
            .from('merchants')
            .select('*')
            .eq('merchant_id', merchant_id)
            .single();

        if (!merchant) {
            return res.status(404).json({ success: false, error: 'Merchant not found' });
        }

        if (merchant.status !== 'active') {
            return res.status(403).json({ success: false, error: 'Merchant not active' });
        }

        const amountUnits = toUnits(amount);
        const fees = calculateFees(amountUnits);
        const txId = generateId('TX');

        const { data: tx, error: txError } = await supabase
            .rpc('process_merchant_payment', {
                p_tx_id: txId,
                p_payer: payerId,
                p_merchant_user_id: merchant.user_id,
                p_amount: amountUnits,
                p_fee_total: fees.totalFee,
                p_fee_operator: fees.operatorFee,
                p_fee_treasury: fees.treasuryFee,
                p_net_amount: fees.netAmount,
                p_note: note || `Payment to ${merchant.merchant_name}`
            });

        if (txError) {
            return res.status(400).json({ success: false, error: txError.message });
        }

        res.json({
            success: true,
            message: 'Payment successful',
            merchant_name: merchant.merchant_name,
            amount: fromUnits(amountUnits),
            net_amount: fromUnits(fees.netAmount),
            fee_total: fromUnits(fees.totalFee)
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ========== MY MERCHANTS ==========
router.get('/my', authUser, async (req, res) => {
    try {
        const userId = req.user.user_id;

        const { data: merchants, error } = await supabase
            .from('merchants')
            .select('*')
            .eq('user_id', userId);

        if (error) {
            return res.status(500).json({ success: false, error: error.message });
        }

        res.json({ success: true, merchants: merchants || [] });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
