require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.log("WARNING: SUPABASE_URL atau SUPABASE_KEY belum diisi di Railway Variables");
}

const supabase = createClient(SUPABASE_URL || '', SUPABASE_KEY || '');

app.get('/', (req, res) => {
    res.send('Prismex-Shallar Server Gateway is running!');
});

app.get('/api/health', async (req, res) => {
    try {
        const { data, error } = await supabase.from('operators').select('*').limit(1);
        if (error) {
            return res.status(500).json({ success: false, error: error.message });
        }
        res.json({ success: true, message: 'Server gateway online!', data });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server jalan di port ${PORT}`);
});