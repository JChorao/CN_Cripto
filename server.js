const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

mongoose.connect(process.env.MONGO_URL || 'mongodb://mongo:27017/crypto_db');

const PriceSchema = new mongoose.Schema({
    cryptoId: String,
    price: Number,
    timestamp: { type: Date, default: Date.now }
});
const Price = mongoose.model('Price', PriceSchema);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

const COINS = ['bitcoin', 'ethereum', 'solana', 'tether', 'ripple'];

async function updateMarketPrices() {
    try {
        const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${COINS.join(',')}&vs_currencies=eur`);
        const updatedPrices = {};

        for (const coin of COINS) {
            if (response.data[coin]) {
                const newPrice = response.data[coin].eur;
                await Price.create({ cryptoId: coin, price: newPrice });
                updatedPrices[coin] = newPrice;
            }
        }
        // Envia os novos preços para o frontend em tempo real
        io.emit('priceUpdate', updatedPrices);
    } catch (err) {
        console.error("Erro API:", err.message);
    }
}

setInterval(updateMarketPrices, 30000); // Atualiza a cada 30 segundos

app.get('/', async (req, res) => {
    const coinData = {};
    for (const coin of COINS) {
        coinData[coin] = await Price.find({ cryptoId: coin }).sort({ timestamp: -1 }).limit(50);
    }
    res.render('index', { coinData });
});

server.listen(3000, () => {
    console.log('Servidor em tempo real: http://localhost:3000');
    updateMarketPrices();
});