const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

// ========== KONFIGURASI SUPABASE ==========
const SUPABASE_URL = 'https://xxxx.supabase.co'; // GANTI dengan URL lo
const SUPABASE_KEY = 'xxxx'; // GANTI dengan anon key lo
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ========== TEST DATABASE ==========
app.get('/api/health', async (req, res) => {
    const { data, error } = await supabase.from('operators').select('*').limit(1);
    if (error) return res.status(500).json({ success: false, error: error.message });
    res.json({ success: true, message: 'Server gateway online!', data });
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
    console.log(`🚀 Server Gateway Prismex-Shallar jalan di port ${PORT}`);
});
