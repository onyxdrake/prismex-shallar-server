-- ========== PROCESS STAKE (ATOMIC) ==========
CREATE OR REPLACE FUNCTION process_stake(
    p_user_id TEXT,
    p_protocol TEXT,
    p_amount BIGINT,
    p_ledger_id TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_balance BIGINT;
BEGIN
    -- Ambil saldo user
    SELECT amount INTO user_balance
    FROM balances
    WHERE user_id = p_user_id AND protocol = p_protocol;

    IF user_balance IS NULL OR user_balance < p_amount THEN
        RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance');
    END IF;

    -- Kurangi saldo available
    UPDATE balances
    SET amount = amount - p_amount, updated_at = NOW()
    WHERE user_id = p_user_id AND protocol = p_protocol;

    -- Tambah ke stakes
    INSERT INTO stakes (user_id, protocol, amount, start_date, last_yield_update, status)
    VALUES (p_user_id, p_protocol, p_amount, NOW(), NOW(), 'active');

    -- Catat ledger
    INSERT INTO ledger (ledger_id, user_id, protocol, entry_type, amount, reference_tx_id, created_at)
    VALUES (p_ledger_id, p_user_id, p_protocol, 'STAKE_LOCK', p_amount, NULL, NOW());

    RETURN jsonb_build_object('success', true);
END;
$$;
