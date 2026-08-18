const express = require('express');
const router = express.Router();
const { supabase, authUser, toUnits, fromUnits, calculateFees, generateId } = require('../config/supabase');

// ========== TRANSFER P2P ==========
router.post('/p2p', authUser, async (req, res) => {
    try {
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
            fee_total: fromUnits(fees.totalFee),
            fee_operator: fromUnits(fees.operatorFee),
            fee_treasury: fromUnits(fees.treasuryFee)
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ========== REQUEST PAYMENT ==========
router.post('/request', authUser, async (req, res) => {
    try {
        const requester = req.user.user_id;
        const { payer_user_id, amount, note } = req.body;

        if (!payer_user_id || !amount || parseFloat(amount) <= 0) {
            return res.status(400).json({ success: false, error: 'Invalid request data' });
        }

        const amountUnits = toUnits(amount);
        const requestId = generateId('REQ');

        const { error } = await supabase
            .from('payment_requests')
            .insert([{
                request_id: requestId,
                requester_user_id: requester,
                payer_user_id,
                amount: amountUnits,
                note: note || '',
                status: 'pending',
                created_at: new Date().toISOString()
            }]);

        if (error) {
            return res.status(500).json({ success: false, error: error.message });
        }

        res.json({
            success: true,
            message: 'Payment request sent',
            request_id: requestId,
            amount: fromUnits(amountUnits)
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ========== TRANSACTION STATUS ==========
router.get('/status/:tx_id', async (req, res) => {
    try {
        const { tx_id } = req.params;

        const { data: tx, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('tx_id', tx_id)
            .single();

        if (error || !tx) {
            return res.status(404).json({ success: false, error: 'Transaction not found' });
        }

        res.json({
            success: true,
            transaction: {
                tx_id: tx.tx_id,
                protocol: tx.protocol,
                sender: tx.sender_user_id,
                receiver: tx.receiver_user_id,
                amount: fromUnits(Number(tx.amount)),
                fee_operator: fromUnits(Number(tx.fee_operator)),
                fee_treasury: fromUnits(Number(tx.fee_treasury)),
                status: tx.status,
                note: tx.note,
                created_at: tx.created_at
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ========== LIST PAYMENT REQUESTS ==========
router.get('/requests', authUser, async (req, res) => {
    try {
        const userId = req.user.user_id;

        const { data: requests } = await supabase
            .from('payment_requests')
            .select('*')
            .or(`requester_user_id.eq.${userId},payer_user_id.eq.${userId}`)
            .order('created_at', { ascending: false })
            .limit(50);

        res.json({ success: true, requests: requests || [] });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
