-- ========== OPERATORS AWAL ==========
INSERT INTO operators (operator_id, protocol, region, wallet_address, status)
VALUES 
('op-prx-asia', 'PRX', 'ASIA', '0xf42D3E7e2dAC1c25222ad575066FBeA968e30b72', 'active'),
('op-prx-us', 'PRX', 'US', '0x5e83C7B43b759525C14F4B0ed84b43E9753280D2', 'active'),
('op-shl-eu', 'SHL', 'EUROPE', '0xB182Bd2423911C18774e425B6f03E0e204B83CE5', 'active'),
('op-shl-sa', 'SHL', 'SOUTH_AMERICA', '0x117e1d2e503ee600CcB60B0BCb47789D5250Bf0A', 'active'),
('op-tt-hub', 'BOTH', 'MIDDLE_EAST', '0x79e631A91D06500413Cb58c56EA890Be15448f25', 'active');

-- ========== FEE POOL ==========
INSERT INTO fee_pool (protocol, operator_fee, treasury_fee, yield_fee)
VALUES 
('PRX', 0, 0, 0),
('SHL', 0, 0, 0);

-- ========== CATATAN ==========
-- Stored procedure process_transfer harus dibuat manual di SQL Editor
-- Stored procedure process_stake harus dibuat manual di SQL Editor
-- Stored procedure process_unstake harus dibuat manual di SQL Editor
-- Stored procedure process_merchant_payment harus dibuat manual di SQL Editor
