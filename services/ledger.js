const { supabase, generateId } = require('../config/supabase');

// ========== LEDGER ENTRY TYPES ==========
const ENTRY_TYPES = {
    MINT: 'MINT',
    BURN: 'BURN',
    TRANSFER_IN: 'TRANSFER_IN',
    TRANSFER_OUT: 'TRANSFER_OUT',
    STAKE_LOCK: 'STAKE_LOCK',
    STAKE_UNLOCK: 'STAKE_UNLOCK',
    FEE_OPERATOR: 'FEE_OPERATOR',
    FEE_TREASURY: 'FEE_TREASURY',
    YIELD_REWARD: 'YIELD_REWARD'
};

// ========== ADD LEDGER ENTRY ==========
async function addLedgerEntry({
    user_id,
    protocol,
    entry_type,
    amount,
    reference_tx_id = null
}) {
    const ledgerId = generateId('LEDGER');

    const { data, error } = await supabase
        .from('ledger')
        .insert([{
            ledger_id: ledgerId,
            user_id,
            protocol,
            entry_type,
            amount,
            reference_tx_id,
            created_at: new Date().toISOString()
        }]);

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

// ========== GET LEDGER ENTRIES ==========
async function getLedgerEntries(userId, limit = 100) {
    const { data, error } = await supabase
        .from('ledger')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        throw new Error(error.message);
    }

    return data || [];
}

// ========== VERIFY BALANCE ==========
async function verifyBalance(userId, protocol) {
    // Hitung saldo dari ledger
    const { data: entries } = await supabase
        .from('ledger')
        .select('entry_type, amount')
        .eq('user_id', userId)
        .eq('protocol', protocol);

    let calculatedBalance = 0;

    (entries || []).forEach(entry => {
        switch (entry.entry_type) {
            case ENTRY_TYPES.MINT:
            case ENTRY_TYPES.TRANSFER_IN:
            case ENTRY_TYPES.STAKE_UNLOCK:
            case ENTRY_TYPES.YIELD_REWARD:
                calculatedBalance += Number(entry.amount);
                break;
            case ENTRY_TYPES.BURN:
            case ENTRY_TYPES.TRANSFER_OUT:
            case ENTRY_TYPES.STAKE_LOCK:
            case ENTRY_TYPES.FEE_OPERATOR:
            case ENTRY_TYPES.FEE_TREASURY:
                calculatedBalance -= Number(entry.amount);
                break;
        }
    });

    // Bandingkan dengan balances table
    const { data: balanceRow } = await supabase
        .from('balances')
        .select('amount')
        .eq('user_id', userId)
        .eq('protocol', protocol)
        .single();

    const storedBalance = balanceRow ? Number(balanceRow.amount) : 0;

    return {
        ledger_balance: calculatedBalance,
        stored_balance: storedBalance,
        is_valid: calculatedBalance === storedBalance,
        difference: storedBalance - calculatedBalance
    };
}

// ========== GET TOTAL CIRCULATION ==========
async function getTotalCirculation(protocol) {
    const { data: balanceRows } = await supabase
        .from('balances')
        .select('amount')
        .eq('protocol', protocol);

    const total = balanceRows ? balanceRows.reduce((sum, b) => sum + Number(b.amount), 0) : 0;

    return total;
}

// ========== AUDIT LEDGER ==========
async function auditLedger(protocol) {
    const { data: ledgers } = await supabase
        .from('ledger')
        .select('*')
        .eq('protocol', protocol);

    let totalIn = 0;
    let totalOut = 0;

    (ledgers || []).forEach(entry => {
        const amount = Number(entry.amount);
        if (['MINT', 'TRANSFER_IN', 'STAKE_UNLOCK', 'YIELD_REWARD'].includes(entry.entry_type)) {
            totalIn += amount;
        } else {
            totalOut += amount;
        }
    });

    return {
        total_in: totalIn,
        total_out: totalOut,
        net: totalIn - totalOut,
        total_entries: ledgers ? ledgers.length : 0
    };
}

module.exports = {
    ENTRY_TYPES,
    addLedgerEntry,
    getLedgerEntries,
    verifyBalance,
    getTotalCirculation,
    auditLedger
};
