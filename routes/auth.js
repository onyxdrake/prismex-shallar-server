const express = require('express');
const router = express.Router();
const { supabase, generateSalt, generateToken, hashSecret, generateAccountNumber, authUser } = require('../config/supabase');

// ========== REGISTER ==========
router.post('/register', async (req, res) => {
    const { user_id, telegram_id, wallet_address, secret } = req.body;

    if (!user_id || !secret) {
        return res.status(400).json({ success: false, error: 'user_id and secret required' });
    }

    if (secret.length < 8) {
        return res.status(400).json({ success: false, error: 'Secret must be at least 8 characters' });
    }

    const salt = generateSalt();
    const secretHash = hashSecret(secret, salt);
    const token = generateToken();
    const tokenHash = hashSecret(token, salt);
    const accountNumber = generateAccountNumber();

    const { data: existing } = await supabase
        .from('users')
        .select('user_id')
        .eq('user_id', user_id)
        .single();

    if (existing) {
        return res.status(409).json({ success: false, error: 'User already exists' });
    }

    const { error } = await supabase
        .from('users')
        .insert([{
            user_id,
            telegram_id: telegram_id || null,
            wallet_address: wallet_address || null,
            salt,
            secret_hash: secretHash,
            token_hash: tokenHash,
            account_number: accountNumber,
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }]);

    if (error) {
        return res.status(400).json({ success: false, error: error.message });
    }

    res.json({
        success: true,
        message: 'Account created',
        user_id,
        account_number: accountNumber,
        auth_token: token
    });
});

// ========== LOGIN ==========
router.post('/login', async (req, res) => {
    const { user_id, secret } = req.body;

    if (!user_id || !secret) {
        return res.status(400).json({ success: false, error: 'user_id and secret required' });
    }

    const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', user_id)
        .single();

    if (!user) {
        return res.status(401).json({ success: false, error: 'User not found' });
    }

    const hashed = hashSecret(secret, user.salt);

    if (hashed !== user.secret_hash) {
        return res.status(403).json({ success: false, error: 'Invalid secret' });
    }

    if (user.status !== 'active') {
        return res.status(403).json({ success: false, error: 'Account frozen' });
    }

    const token = generateToken();
    const tokenHash = hashSecret(token, user.salt);

    await supabase
        .from('users')
        .update({ token_hash: tokenHash, updated_at: new Date().toISOString() })
        .eq('user_id', user_id);

    res.json({
        success: true,
        message: 'Login successful',
        user_id: user.user_id,
        account_number: user.account_number,
        auth_token: token
    });
});

// ========== CHANGE SECRET ==========
router.post('/change-secret', authUser, async (req, res) => {
    const { old_secret, new_secret } = req.body;

    if (!old_secret || !new_secret) {
        return res.status(400).json({ success: false, error: 'old_secret and new_secret required' });
    }

    if (new_secret.length < 8) {
        return res.status(400).json({ success: false, error: 'New secret must be at least 8 characters' });
    }

    const hashedOld = hashSecret(old_secret, req.user.salt);

    if (hashedOld !== req.user.secret_hash) {
        return res.status(403).json({ success: false, error: 'Old secret is incorrect' });
    }

    const newSalt = generateSalt();
    const newHash = hashSecret(new_secret, newSalt);

    const { error } = await supabase
        .from('users')
        .update({ salt: newSalt, secret_hash: newHash, updated_at: new Date().toISOString() })
        .eq('user_id', req.user.user_id);

    if (error) {
        return res.status(500).json({ success: false, error: error.message });
    }

    res.json({ success: true, message: 'Secret changed successfully' });
});

// ========== LOGOUT ==========
router.post('/logout', authUser, async (req, res) => {
    await supabase
        .from('users')
        .update({ token_hash: null, updated_at: new Date().toISOString() })
        .eq('user_id', req.user.user_id);

    res.json({ success: true, message: 'Logged out successfully' });
});

// ========== DELETE ACCOUNT ==========
router.delete('/delete', authUser, async (req, res) => {
    const { error } = await supabase
        .from('users')
        .update({ status: 'suspended', updated_at: new Date().toISOString() })
        .eq('user_id', req.user.user_id);

    if (error) {
        return res.status(500).json({ success: false, error: error.message });
    }

    res.json({ success: true, message: 'Account suspended' });
});

module.exports = router;
