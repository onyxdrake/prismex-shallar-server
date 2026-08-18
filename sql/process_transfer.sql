-- ========== PROCESS TRANSFER (ATOMIC) ==========
CREATE OR REPLACE FUNCTION process_transfer(
    p_tx_id TEXT,
    p_sender TEXT,
    p_receiver TEXT,
    p_protocol TEXT,
    p_amount BIGINT,
    p_fee_total BIGINT,
    p_fee_operator BIGINT,
    p_fee_treasury BIGINT,
    p_net_amount BIGINT,
    p_note TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    sender_balance BIGINT;
    receiver_balance BIGINT;
BEGIN
    -- Ambil saldo sender
    SELECT amount INTO sender_balance
    FROM balances
    WHERE user_id = p_sender AND protocol = p_protocol;

    IF sender_balance IS NULL OR sender_balance < p_amount THEN
        RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance');
    END IF;

    -- Kurangi saldo sender
    UPDATE balances
    SET amount = amount - p_amount, updated_at = NOW()
    WHERE user_id = p_sender AND protocol = p_protocol;

    -- Tambah saldo receiver
    INSERT INTO balances (user_id, protocol, amount, updated_at)
    VALUES (p_receiver, p_protocol, p_net_amount, NOW())
    ON CONFLICT (user_id, protocol)
    DO UPDATE SET amount = balances.amount + p_net_amount, updated_at = NOW();

    -- Catat transaksi
    INSERT INTO transactions (
        tx_id, protocol, sender_user_id, receiver_user_id,
        amount, fee_operator, fee_treasury, operator_id, status, note, created_at
    ) VALUES (
        p_tx_id, p_protocol, p_sender, p_receiver,
        p_net_amount, p_fee_operator, p_fee_treasury, 'system', 'completed', p_note, NOW()
    );

    -- Catat ledger
    INSERT INTO ledger (ledger_id, user_id, protocol, entry_type, amount, reference_tx_id, created_at)
    VALUES 
    ('LEDGER-' || p_tx_id || '-OUT', p_sender, p_protocol, 'TRANSFER_OUT', p_amount, p_tx_id, NOW()),
    ('LEDGER-' || p_tx_id || '-IN', p_receiver, p_protocol, 'TRANSFER_IN', p_net_amount, p_tx_id, NOW()),
    ('LEDGER-' || p_tx_id || '-FEE', p_sender, p_protocol, 'FEE_TREASURY', p_fee_treasury, p_tx_id, NOW());

    RETURN jsonb_build_object('success', true, 'tx_id', p_tx_id);
END;
$$;
