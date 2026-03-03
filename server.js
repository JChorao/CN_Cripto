const express = require('express');
// const mongoose = require('mongoose'); // TEMPORARIAMENTE COMENTADO
const axios = require('axios');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// LIGAÇÃO À BD TEMPORARIAMENTE COMENTADA PARA TESTE
// mongoose.connect(process.env.MONGO_URL || 'mongodb://mongo:27017/crypto_db');

/* COMENTADO PARA NÃO DAR ERRO
const PriceSchema = new mongoose.Schema({
    cryptoId: String,
    price: Number,
    timestamp: { type: Date, default: Date.now }
});
const Price = mongoose.model('Price', PriceSchema);
*/

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
                // await Price.create({ cryptoId: coin, price: newPrice }); // NÃO GRAVA NA BD POR AGORA
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
        // EM VEZ DE IR À BD, ENVIA UM ARRAY VAZIO PARA A PÁGINA NÃO CRASHAR
        // coinData[coin] = await Price.find({ cryptoId: coin }).sort({ timestamp: -1 }).limit(50);
        coinData[coin] = []; 
    }
    res.render('index', { coinData });
});

// ALTERAÇÃO CRUCIAL PARA A AZURE: USAR O process.env.PORT
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor a correr na porta: ${PORT}`);
    updateMarketPrices();
});