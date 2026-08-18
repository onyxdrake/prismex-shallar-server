const express = require('express');
const router = express.Router();
const { supabase, authUser, toUnits, fromUnits, generateId } = require('../config/supabase');

const STAKING_APY_BPS = 250; // 2.50% dalam basis points
const YEAR_IN_DAYS = 365;

// ========== VALIDASI NOMINAL ==========
function validateAmount(amount) {
    if (typeof amount !== 'number' && typeof amount !== 'string') return false;
    const num = Number(amount);
    if (!Number.isFinite(num) || num <= 0) return false;
    if (num.toString().split('.')[1]?.length > 6) return false;
    return true;
}

// ========== STAKE ==========
router.post('/stake', authUser, async (req, res) => {
    const userId = req.user.user_id;
    const { protocol, amount } = req.body;

    if (!validateAmount(amount)) {
        return res.status(400).json({ success: false, error: 'Invalid stake amount' });
    }

    const amountUnits = toUnits(amount);

    const { error } = await supabase
        .rpc('process_stake', {
            p_user_id: userId,
            p_protocol: protocol || 'PRX',
            p_amount: amountUnits,
            p_ledger_id: generateId('LEDGER')
        });

    if (error) {
        return res.status(400).json({ success: false, error: error.message });
    }

    res.json({ success: true, message: `Staked ${amount} ${protocol || 'PRX'}` });
});

// ========== UNSTAKE ==========
router.post('/unstake', authUser, async (req, res) => {
    const userId = req.user.user_id;
    const { protocol, amount } = req.body;

    if (!validateAmount(amount)) {
        return res.status(400).json({ success: false, error: 'Invalid unstake amount' });
    }

    const amountUnits = toUnits(amount);

    const { error } = await supabase
        .rpc('process_unstake', {
            p_user_id: userId,
            p_protocol: protocol || 'PRX',
            p_amount: amountUnits,
            p_ledger_id: generateId('LEDGER')
        });

    if (error) {
        return res.status(400).json({ success: false, error: error.message });
    }

    res.json({ success: true, message: `Unstaked ${amount} ${protocol || 'PRX'}` });
});

// ========== YIELD ==========
router.get('/yield', authUser, async (req, res) => {
    const userId = req.user.user_id;

    const { data: stakes } = await supabase
        .from('stakes')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active');

    const totalUnits = stakes ? stakes.reduce((sum, s) => sum + Number(s.amount), 0) : 0;
    const yearlyUnits = Math.floor(totalUnits * STAKING_APY_BPS / 10000);
    const dailyUnits = Math.floor(yearlyUnits / YEAR_IN_DAYS);

    res.json({
        success: true,
        total_staked: fromUnits(totalUnits),
        yearly_yield: fromUnits(yearlyUnits).toFixed(6),
        daily_yield: fromUnits(dailyUnits).toFixed(6),
        apy: `${STAKING_APY_BPS / 100}%`
    });
});

// ========== LIST STAKES ==========
router.get('/list', authUser, async (req, res) => {
    const userId = req.user.user_id;

    const { data: stakes } = await supabase
        .from('stakes')
        .select('id, protocol, amount, start_date, status')
        .eq('user_id', userId)
        .order('start_date', { ascending: false });

    res.json({ success: true, stakes: stakes || [] });
});

module.exports = router;
