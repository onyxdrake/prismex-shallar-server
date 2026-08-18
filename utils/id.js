const crypto = require('crypto');

// ========== GENERATE RANDOM BYTES ==========
function generateRandomBytes(size = 32) {
    return crypto.randomBytes(size).toString('hex');
}

// ========== GENERATE SALT ==========
function generateSalt() {
    return crypto.randomBytes(16).toString('hex');
}

// ========== GENERATE TOKEN ==========
function generateToken() {
    return crypto.randomBytes(48).toString('hex');
}

// ========== GENERATE ID ==========
function generateId(prefix) {
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    return `${prefix}-${timestamp}-${random}`;
}

// ========== GENERATE ACCOUNT NUMBER ==========
function generateAccountNumber() {
    return `PX-${Math.floor(100000000 + Math.random() * 900000000)}`;
}

// ========== GENERATE TX ID ==========
function generateTxId() {
    return generateId('TX');
}

// ========== GENERATE LEDGER ID ==========
function generateLedgerId() {
    return generateId('LEDGER');
}

// ========== GENERATE MERCHANT ID ==========
function generateMerchantId() {
    return generateId('MERCH');
}

// ========== GENERATE REQUEST ID ==========
function generateRequestId() {
    return generateId('REQ');
}

// ========== HASH SECRET ==========
function hashSecret(secret, salt) {
    return crypto.createHash('sha256').update(salt + secret).digest('hex');
}

// ========== HASH TOKEN ==========
function hashToken(token, salt) {
    return crypto.createHash('sha256').update(salt + token).digest('hex');
}

// ========== VERIFY HASH ==========
function verifyHash(secret, salt, expectedHash) {
    const hashed = hashSecret(secret, salt);
    return hashed === expectedHash;
}

module.exports = {
    generateRandomBytes,
    generateSalt,
    generateToken,
    generateId,
    generateAccountNumber,
    generateTxId,
    generateLedgerId,
    generateMerchantId,
    generateRequestId,
    hashSecret,
    hashToken,
    verifyHash
};
