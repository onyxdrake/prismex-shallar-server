// ========== PRISMEX CONSTANTS ==========

module.exports = {
    // ========== SYSTEM ==========
    SYSTEM_NAME: 'Prismex Digital Gold Currency',
    SYSTEM_VERSION: '2.0.0',
    NETWORK_TYPE: 'Private Ledger',
    
    // ========== CURRENCY ==========
    DEFAULT_PROTOCOL: 'PRX',
    SUPPORTED_PROTOCOLS: ['PRX', 'SHL', 'PRX-G', 'PRX-S', 'USD'],
    
    // ========== DECIMALS ==========
    PRX_DECIMALS: 6,
    PRX_UNIT: Math.pow(10, 6),
    GOLD_DECIMALS: 6,
    
    // ========== FEES ==========
    TRANSFER_FEE_PERCENT: 0.02,
    OPERATOR_FEE_SHARE: 0.25,
    TREASURY_FEE_SHARE: 0.75,
    STAKING_APY: 0.025,
    MINT_FEE_PERCENT: 0.05,
    
    // ========== LIMITS ==========
    MAX_TRANSFER: parseFloat(process.env.MAX_TRANSFER || '1000000'),
    DAILY_LIMIT: parseFloat(process.env.DAILY_LIMIT || '100000'),
    
    // ========== RATE LIMITS ==========
    RATE_LIMIT_WINDOW_MS: 60 * 1000,
    RATE_LIMIT_MAX: 300,
    
    // ========== STATUS ==========
    USER_STATUS: ['active', 'frozen', 'suspended'],
    OPERATOR_STATUS: ['pending', 'active', 'offline', 'suspended'],
    MERCHANT_STATUS: ['pending', 'active', 'suspended'],
    TX_STATUS: ['pending', 'completed', 'failed', 'reversed'],
    STAKE_STATUS: ['active', 'withdrawn'],
    
    // ========== REGIONS ==========
    REGIONS: ['ASIA', 'US', 'EUROPE', 'SOUTH_AMERICA', 'MIDDLE_EAST', 'ALL'],
    
    // ========== RESERVE ==========
    RESERVE_GOLD_GRAMS: 1000,
    RESERVE_COVERAGE: '100%',
    RESERVE_VAULT_LOCATION: 'Singapore',
    RESERVE_LAST_AUDIT: '2026-08-01',
    
    // ========== GOLD ==========
    GOLD_API_BASE_URL: 'https://api.gold-api.com/price/XAU',
    GOLD_GRAMS_PER_OUNCE: 31.1035,
    
    // ========== OPERATOR ==========
    OPERATOR_FEE_PERCENT: 0.001,
    OPERATOR_MIN_UPTIME_HOURS: 18,
    
    // ========== STAKING ==========
    STAKING_MIN_AMOUNT: 10,
    STAKING_LOCK_DAYS: 0,
    
    // ========== MERCHANT ==========
    MERCHANT_MIN_AMOUNT: 1,
    
    // ========== SECURITY ==========
    SECRET_MIN_LENGTH: 8,
    TOKEN_EXPIRY_DAYS: 30,
    
    // ========== ADMIN ==========
    ADMIN_ROLES: ['super_admin', 'reserve_admin', 'security_admin', 'operator_admin'],
    
    // ========== NOTIFICATION ==========
    NOTIFY_ON_RECEIVE: true,
    NOTIFY_ON_SEND: true,
    
    // ========== EXPORT ==========
    MAX_EXPORT_TRANSACTIONS: 500,
    
    // ========== LEDGER ==========
    LEDGER_SOURCE_OF_TRUTH: true,
    BALANCE_IS_DERIVED: true,
    
    // ========== MISC ==========
    SUPPORT_EMAIL: 'support@prismex.io',
    WEBSITE: 'https://prismex.io',
    TELEGRAM_CHANNEL: '@contactprismex',
    TELEGRAM_BOT: '@Wallet_prismex_bot'
};