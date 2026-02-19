const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const path = require('path');
const app = express();

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

// Função de atualização robusta com tratamento de erros (Rate Limit)
async function updateMarketPrices() {
    try {
        console.log("A atualizar preços do mercado...");
        const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${COINS.join(',')}&vs_currencies=eur`);
        
        for (const coin of COINS) {
            if (response.data[coin]) {
                await Price.create({ 
                    cryptoId: coin, 
                    price: response.data[coin].eur,
                    timestamp: new Date() 
                });
            }
        }
    } catch (err) {
        if (err.response && err.response.status === 429) {
            console.error("Aviso: Limite de chamadas à API atingido. A aguardar...");
        } else {
            console.error("Erro API:", err.message);
        }
    }
}

// Atualiza automaticamente a cada 30 segundos (background task)
setInterval(updateMarketPrices, 60000);

app.get('/', async (req, res) => {
    const coinData = {};
    for (const coin of COINS) {
        // Vai buscar os últimos 20 registos para garantir histórico no gráfico
        coinData[coin] = await Price.find({ cryptoId: coin }).sort({ timestamp: -1 }).limit(20);
    }
    res.render('index', { coinData });
});

app.listen(3000, () => {
    console.log('App: http://localhost:3000');
    updateMarketPrices(); // Primeira atualização ao ligar
});