-- ========== PROCESS YIELD DISTRIBUTION (ATOMIC) ==========
CREATE OR REPLACE FUNCTION process_yield(
    p_user_id TEXT,
    p_protocol TEXT,
    p_amount BIGINT,
    p_ledger_id TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Tambah saldo user
    INSERT INTO balances (user_id, protocol, amount, updated_at)
    VALUES (p_user_id, p_protocol, p_amount, NOW())
    ON CONFLICT (user_id, protocol)
    DO UPDATE SET amount = balances.amount + p_amount, updated_at = NOW();

    -- Catat yield log
    INSERT INTO yield_logs (user_id, protocol, amount, yield_type, created_at)
    VALUES (p_user_id, p_protocol, p_amount, 'user', NOW());

    -- Catat ledger
    INSERT INTO ledger (ledger_id, user_id, protocol, entry_type, amount, reference_tx_id, created_at)
    VALUES (p_ledger_id, p_user_id, p_protocol, 'YIELD_REWARD', p_amount, NULL, NOW());

    RETURN jsonb_build_object('success', true);
END;
$$;
