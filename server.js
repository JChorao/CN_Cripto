const express = require('express');
const { CosmosClient } = require('@azure/cosmos');
const app = express();

// Configuração CosmosDB
const client = new CosmosClient(process.env.COSMOS_CONNECTION_STRING);
const database = client.database("CSGO_Skins");
const container = database.container("PriceHistory");

app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get('/', async (req, res) => {
    // Procura os últimos preços no CosmosDB
    const { resources: items } = await container.items
        .query("SELECT * FROM c WHERE c.skinId = 'ak47-vulcan' ORDER BY c.timestamp DESC")
        .fetchAll();

    res.render('index', { priceData: items });
});

app.listen(3000, () => console.log('App a correr na porta 3000'));