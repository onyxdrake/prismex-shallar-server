
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

// ========== KONFIGURASI ==========
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';
const OPERATOR_SECRET = process.env.OPERATOR_SECRET || 'rahasia-123';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ========== HALAMAN UTAMA ==========
app.get('/', (req, res) => {
    res.send('Prismex-Shallar Server Gateway is running!');
});

// ========== CEK KESEHATAN ==========
app.get('/api/health', async (req, res) => {
    try {
        const { data, error } = await supabase.from('operators').select('*').limit(5);
        if (error) {
            return res.status(500).json({ success: false, error: error.message });
        }
        res.json({ success: true, message: 'Server gateway online!', data });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ========== DAFTAR OPERATOR ==========
app.post('/api/operator/register', async (req, res) => {
    const { operator_id, protocol, region, wallet_address } = req.body;

    const { data, error } = await supabase
        .from('operators')
        .insert([{ operator_id, protocol, region, wallet_address, status: 'pending' }]);

    if (error) return res.status(400).json({ success: false, error: error.message });
    res.json({ success: true, message: 'Pendaftaran operator diterima!', data });
});

// ========== OPERATOR AMBIL TUGAS ==========
app.post('/api/operator/task', async (req, res) => {
    const { operator_id, operator_secret } = req.body;

    // Verifikasi secret
    if (operator_secret !== OPERATOR_SECRET) {
        return res.status(403).json({ success: false, error: 'Token salah' });
    }

    // Verifikasi operator
    const { data: op, error } = await supabase
        .from('operators')
        .select('*')
        .eq('operator_id', operator_id)
        .single();

    if (error || !op) {
        return res.status(401).json({ success: false, error: 'Operator tidak ditemukan' });
    }

    // Ambil transaksi yang perlu diproses
    const { data: txs } = await supabase
        .from('transactions')
        .select('*')
        .eq('operator_id', operator_id)
        .limit(10);

    res.json({ success: true, tasks: txs });
});

// ========== TRANSAKSI ==========
app.post('/api/transact', async (req, res) => {
    const { tx_id, protocol, sender_user_id, receiver_user_id, amount, operator_id } = req.body;

    const fee_operator = amount * 0.001;
    const fee_treasury = amount * 0.002;
    const netAmount = amount - fee_operator - fee_treasury;

    const { data, error } = await supabase
        .from('transactions')
        .insert([{
            tx_id,
            protocol,
            sender_user_id,
            receiver_user_id,
            amount: netAmount,
            fee_operator,
            fee_treasury,
            operator_id
        }]);

    if (error) return res.status(400).json({ success: false, error: error.message });
    res.json({ success: true, message: 'Transaksi berhasil!', netAmount });
});

// ========== CEK SALDO ==========
app.get('/api/balance/:user_id', async (req, res) => {
    const { user_id } = req.params;

    const { data, error } = await supabase
        .from('balances')
        .select('*')
        .eq('user_id', user_id);

    if (error) return res.status(400).json({ success: false, error: error.message });
    res.json({ success: true, balances: data });
});

// ========== JALANKAN SERVER ==========
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});