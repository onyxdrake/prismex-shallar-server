-- ========== PROCESS UNSTAKE (ATOMIC) ==========
CREATE OR REPLACE FUNCTION process_unstake(
    p_user_id TEXT,
    p_protocol TEXT,
    p_amount BIGINT,
    p_ledger_id TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    stake_amount BIGINT;
BEGIN
    -- Cari stake aktif
    SELECT amount INTO stake_amount
    FROM stakes
    WHERE user_id = p_user_id AND protocol = p_protocol AND status = 'active'
    LIMIT 1;

    IF stake_amount IS NULL OR stake_amount < p_amount THEN
        RETURN jsonb_build_object('success', false, 'error', 'Insufficient stake');
    END IF;

    -- Update stake
    UPDATE stakes
    SET amount = amount - p_amount, last_yield_update = NOW()
    WHERE user_id = p_user_id AND protocol = p_protocol AND status = 'active';

    -- Kalau stake habis, set withdrawn
    UPDATE stakes
    SET status = 'withdrawn'
    WHERE user_id = p_user_id AND protocol = p_protocol AND status = 'active'
    AND amount = 0;

    -- Tambah saldo available
    INSERT INTO balances (user_id, protocol, amount, updated_at)
    VALUES (p_user_id, p_protocol, p_amount, NOW())
    ON CONFLICT (user_id, protocol)
    DO UPDATE SET amount = balances.amount + p_amount, updated_at = NOW();

    -- Catat ledger
    INSERT INTO ledger (ledger_id, user_id, protocol, entry_type, amount, reference_tx_id, created_at)
    VALUES (p_ledger_id, p_user_id, p_protocol, 'STAKE_UNLOCK', p_amount, NULL, NOW());

    RETURN jsonb_build_object('success', true);
END;
$$;
