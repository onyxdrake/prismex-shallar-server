-- ========== HAPUS TABEL LAMA ==========
DROP TABLE IF EXISTS ledger CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS balances CASCADE;
DROP TABLE IF EXISTS stakes CASCADE;
DROP TABLE IF EXISTS yield_logs CASCADE;
DROP TABLE IF EXISTS merchants CASCADE;
DROP TABLE IF EXISTS payment_requests CASCADE;
DROP TABLE IF EXISTS operators CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ========== TABEL USERS ==========
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    telegram_id BIGINT UNIQUE,
    wallet_address TEXT,
    salt TEXT NOT NULL,
    secret_hash TEXT NOT NULL,
    token_hash TEXT,
    account_number TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'frozen', 'suspended')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ========== TABEL OPERATORS ==========
CREATE TABLE operators (
    id SERIAL PRIMARY KEY,
    operator_id TEXT UNIQUE NOT NULL,
    protocol TEXT NOT NULL CHECK (protocol IN ('PRX', 'SHL', 'BOTH')),
    region TEXT NOT NULL,
    wallet_address TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'offline', 'suspended')),
    total_transactions INTEGER DEFAULT 0,
    total_fees_earned BIGINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ========== TABEL BALANCES ==========
CREATE TABLE balances (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    protocol TEXT NOT NULL CHECK (protocol IN ('PRX', 'SHL', 'PRX-G', 'PRX-S', 'USD')),
    amount BIGINT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (user_id, protocol)
);

-- ========== TABEL TRANSACTIONS ==========
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    tx_id TEXT UNIQUE NOT NULL,
    protocol TEXT NOT NULL,
    sender_user_id TEXT NOT NULL,
    receiver_user_id TEXT NOT NULL,
    amount BIGINT NOT NULL,
    fee_operator BIGINT DEFAULT 0,
    fee_treasury BIGINT DEFAULT 0,
    operator_id TEXT,
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'reversed')),
    note TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ========== TABEL LEDGER ==========
CREATE TABLE ledger (
    id SERIAL PRIMARY KEY,
    ledger_id TEXT UNIQUE NOT NULL,
    user_id TEXT NOT NULL,
    protocol TEXT NOT NULL,
    entry_type TEXT NOT NULL CHECK (entry_type IN ('MINT', 'BURN', 'TRANSFER_IN', 'TRANSFER_OUT', 'STAKE_LOCK', 'STAKE_UNLOCK', 'FEE_OPERATOR', 'FEE_TREASURY', 'YIELD_REWARD')),
    amount BIGINT NOT NULL,
    reference_tx_id TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ========== TABEL STAKES ==========
CREATE TABLE stakes (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    protocol TEXT NOT NULL,
    amount BIGINT NOT NULL,
    start_date TIMESTAMP DEFAULT NOW(),
    last_yield_update TIMESTAMP DEFAULT NOW(),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'withdrawn'))
);

-- ========== TABEL YIELD_LOGS ==========
CREATE TABLE yield_logs (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    protocol TEXT NOT NULL,
    amount BIGINT NOT NULL,
    yield_type TEXT NOT NULL CHECK (yield_type IN ('user', 'platform')),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ========== TABEL MERCHANTS ==========
CREATE TABLE merchants (
    id SERIAL PRIMARY KEY,
    merchant_id TEXT UNIQUE NOT NULL,
    user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    merchant_name TEXT NOT NULL,
    business_type TEXT NOT NULL,
    city TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended')),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ========== TABEL PAYMENT_REQUESTS ==========
CREATE TABLE payment_requests (
    id SERIAL PRIMARY KEY,
    request_id TEXT UNIQUE NOT NULL,
    requester_user_id TEXT NOT NULL,
    payer_user_id TEXT NOT NULL,
    amount BIGINT NOT NULL,
    note TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ========== INDEX ==========
CREATE INDEX idx_transactions_sender ON transactions(sender_user_id);
CREATE INDEX idx_transactions_receiver ON transactions(receiver_user_id);
CREATE INDEX idx_transactions_created ON transactions(created_at);
CREATE INDEX idx_balances_user ON balances(user_id);
CREATE INDEX idx_ledger_user ON ledger(user_id);
CREATE INDEX idx_ledger_tx ON ledger(reference_tx_id);
CREATE INDEX idx_stakes_user ON stakes(user_id);
CREATE INDEX idx_merchants_user ON merchants(user_id);
