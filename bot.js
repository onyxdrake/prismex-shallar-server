const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

// ========== KONFIGURASI ==========
const TELEGRAM_TOKEN = 'GANTI_DENGAN_TOKEN_BOT_LO';
const SERVER_URL = 'https://prismex-shallar-server-production.up.railway.app';

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

// ========== COMMAND /start ==========
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const text = `👋 Selamat datang di Prismex-Shallar!\n\n` +
        `Perintah yang tersedia:\n` +
        `/daftar - Buat akun\n` +
        `/saldo - Cek saldo\n` +
        `/transfer <user_id> <jumlah> - Kirim PRX/SHL\n` +
        `/harga - Lihat harga emas terbaru\n` +
        `/daftaroperator - Jadi operator`;
    bot.sendMessage(chatId, text);
});

// ========== COMMAND /daftar ==========
bot.onText(/\/daftar/, (msg) => {
    const chatId = msg.chat.id;
    const user_id = `user-${chatId}`;
    bot.sendMessage(chatId, `✅ Akun lo dibuat!\nUser ID: ${user_id}`);
});

// ========== COMMAND /saldo ==========
bot.onText(/\/saldo/, async (msg) => {
    const chatId = msg.chat.id;
    const user_id = `user-${chatId}`;

    try {
        const response = await axios.get(`${SERVER_URL}/api/balance/${user_id}`);
        const balances = response.data.balances || [];
        if (balances.length === 0) {
            bot.sendMessage(chatId, '💰 Saldo lo masih kosong.');
        } else {
            let text = '💰 Saldo lo:\n';
            balances.forEach(b => {
                text += `${b.protocol}: ${b.amount}\n`;
            });
            bot.sendMessage(chatId, text);
        }
    } catch (err) {
        bot.sendMessage(chatId, '❌ Gagal cek saldo. Coba lagi nanti.');
    }
});

// ========== COMMAND /transfer ==========
bot.onText(/\/transfer (\S+) (\d+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const receiver = match[1];
    const amount = parseFloat(match[2]);
    const sender = `user-${chatId}`;

    if (!receiver || !amount) {
        bot.sendMessage(chatId, '⚠️ Format: /transfer <user_id> <jumlah>');
        return;
    }

    const tx_id = `tx-${Date.now()}`;

    try {
        const response = await axios.post(`${SERVER_URL}/api/transact`, {
            tx_id,
            protocol: 'PRX',
            sender_user_id: sender,
            receiver_user_id: receiver,
            amount,
            operator_id: 'op-onyx-solo'
        });

        if (response.data.success) {
            bot.sendMessage(chatId, `✅ Transfer berhasil!\nJumlah: ${response.data.netAmount} PRX\nKe: ${receiver}`);
        } else {
            bot.sendMessage(chatId, `❌ Gagal: ${response.data.error}`);
        }
    } catch (err) {
        bot.sendMessage(chatId, '❌ Terjadi kesalahan. Coba lagi nanti.');
    }
});

// ========== COMMAND /daftaroperator ==========
bot.onText(/\/daftaroperator/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, '📝 Untuk daftar operator, kirim data:\n\nNama/ID:\nPerangkat:\nRAM:\nInternet:\nLama nyala/hari:\nWallet address:');
});

console.log('🤖 Bot Telegram Prismex-Shallar jalan...');
