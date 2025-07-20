 const express = require('express');
const cors = require('cors');
const { autoTradeLoop, getLogs } = require('./bot/trader');

const app = express();
app.use(cors());

setInterval(autoTradeLoop, 15000); // run every 15s

app.get('/logs', (req, res) => {
  res.json(getLogs());
});

app.get('/status', (req, res) => {
  res.json({ wallet: process.env.PUBLIC_KEY });
});

app.listen(3001, () => console.log("Bot running at http://localhost:3001"));
