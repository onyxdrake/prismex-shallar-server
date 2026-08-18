const { PRX_UNIT } = require('../config/constants');

// ========== FEE CONSTANTS (dalam basis points) ==========
const TRANSFER_FEE_BPS = 200; // 2%
const OPERATOR_SHARE_BPS = 25; // 25% dari total fee
const TREASURY_SHARE_BPS = 75; // 75% dari total fee
const STAKING_APY_BPS = 250; // 2.5%
const MINT_FEE_BPS = 500; // 5%
const BURN_FEE_BPS = 100; // 1%

// ========== CALCULATE TRANSFER FEES (INTEGER) ==========
function calculateTransferFees(amountUnits) {
    const totalFee = Math.floor(amountUnits * TRANSFER_FEE_BPS / 10000);
    const operatorFee = Math.floor(totalFee * OPERATOR_SHARE_BPS / 100);
    const treasuryFee = totalFee - operatorFee;
    const netAmount = amountUnits - totalFee;

    return {
        totalFee,
        operatorFee,
        treasuryFee,
        netAmount
    };
}

// ========== CALCULATE MINT FEE ==========
function calculateMintFee(amountUnits) {
    const fee = Math.floor(amountUnits * MINT_FEE_BPS / 10000);
    const netAmount = amountUnits - fee;

    return { fee, netAmount };
}

// ========== CALCULATE BURN FEE ==========
function calculateBurnFee(amountUnits) {
    const fee = Math.floor(amountUnits * BURN_FEE_BPS / 10000);
    const netAmount = amountUnits - fee;

    return { fee, netAmount };
}

// ========== CALCULATE STAKING YIELD (INTEGER) ==========
function calculateStakingYield(totalStakedUnits, days = 365) {
    const yearlyYield = Math.floor(totalStakedUnits * STAKING_APY_BPS / 10000);
    const dailyYield = Math.floor(yearlyYield / 365);
    const periodYield = Math.floor(dailyYield * days);

    return {
        yearly_yield: yearlyYield,
        daily_yield: dailyYield,
        period_yield: periodYield,
        apy_bps: STAKING_APY_BPS
    };
}

// ========== CALCULATE OPERATOR FEE DISTRIBUTION ==========
function calculateOperatorDistribution(totalOperatorFee, activeOperators) {
    if (!activeOperators || activeOperators.length === 0) {
        return [];
    }

    const perOperator = Math.floor(totalOperatorFee / activeOperators.length);
    const remainder = totalOperatorFee - (perOperator * activeOperators.length);

    return activeOperators.map((op, index) => ({
        operator_id: op.operator_id,
        fee: perOperator + (index === 0 ? remainder : 0)
    }));
}

// ========== FORMAT AMOUNT ==========
function formatAmount(units) {
    return (units / PRX_UNIT).toFixed(6);
}

module.exports = {
    TRANSFER_FEE_BPS,
    OPERATOR_SHARE_BPS,
    TREASURY_SHARE_BPS,
    STAKING_APY_BPS,
    MINT_FEE_BPS,
    BURN_FEE_BPS,
    calculateTransferFees,
    calculateMintFee,
    calculateBurnFee,
    calculateStakingYield,
    calculateOperatorDistribution,
    formatAmount
};
