// ========== VALIDASI INPUT ==========

function validateAmount(amount) {
    if (typeof amount !== 'number' && typeof amount !== 'string') return false;
    
    const num = Number(amount);
    
    if (!Number.isFinite(num)) return false;
    if (num <= 0) return false;
    if (num > 1000000000) return false; // Maksimal 1 miliar
    if (num.toString().split('.')[1]?.length > 6) return false; // Maksimal 6 desimal
    
    return true;
}

function validateUserId(userId) {
    if (typeof userId !== 'string') return false;
    if (userId.length < 3 || userId.length > 100) return false;
    if (!/^[a-zA-Z0-9_-]+$/.test(userId)) return false;
    return true;
}

function validateSecret(secret) {
    if (typeof secret !== 'string') return false;
    if (secret.length < 8) return false;
    if (secret.length > 200) return false;
    return true;
}

function validateProtocol(protocol) {
    const validProtocols = ['PRX', 'SHL', 'PRX-G', 'PRX-S', 'USD'];
    return validProtocols.includes(protocol);
}

function validateRegion(region) {
    const validRegions = ['ASIA', 'US', 'EUROPE', 'SOUTH_AMERICA', 'MIDDLE_EAST', 'ALL'];
    return validRegions.includes(region);
}

function validateOperatorId(operatorId) {
    if (typeof operatorId !== 'string') return false;
    if (operatorId.length < 3 || operatorId.length > 50) return false;
    if (!/^[a-zA-Z0-9_-]+$/.test(operatorId)) return false;
    return true;
}

function validateWalletAddress(address) {
    if (typeof address !== 'string') return false;
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) return false;
    return true;
}

function validateMerchantName(name) {
    if (typeof name !== 'string') return false;
    if (name.length < 2 || name.length > 100) return false;
    return true;
}

function validateTxId(txId) {
    if (typeof txId !== 'string') return false;
    if (txId.length < 5 || txId.length > 100) return false;
    return true;
}

function sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    return input.replace(/[<>]/g, '').trim();
}

module.exports = {
    validateAmount,
    validateUserId,
    validateSecret,
    validateProtocol,
    validateRegion,
    validateOperatorId,
    validateWalletAddress,
    validateMerchantName,
    validateTxId,
    sanitizeInput
};
