const { Connection, Keypair } = require('@solana/web3.js');
const bs58 = require('bs58');
const axios = require('axios');
require('dotenv').config();

const RPC = 'https://api.mainnet-beta.solana.com';
const JUPITER = 'https://quote-api.jup.ag';
const connection = new Connection(RPC, 'confirmed');

const wallet = Keypair.fromSecretKey(bs58.decode(process.env.PRIVATE_KEY));
const AMOUNT = 0.01 * 1e9;
const THRESHOLD = 0.5; // 0.5% profit
let logs = [];

async function getTokens() {
  const res = await axios.get(`${JUPITER}/v6/tokens`);
  return res.data;
}

async function getQuote(input, output, amount) {
  const url = `${JUPITER}/v6/quote?inputMint=${input}&outputMint=${output}&amount=${amount}&slippageBps=50`;
  const res = await axios.get(url);
  return res.data?.data?.[0];
}

async function getSwapTxn(input, output, amount) {
  const res = await axios.get(`${JUPITER}/v6/swap`, {
    params: {
      inputMint: input,
      outputMint: output,
      amount,
      slippageBps: 50,
      userPublicKey: wallet.publicKey.toBase58(),
    },
  });
  return res.data;
}

async function executeTxn(swapData) {
  const txnBuf = Buffer.from(swapData.swapTransaction, 'base64');
  const txn = await connection.deserializeTransaction(txnBuf);
  txn.partialSign(wallet);
  const txid = await connection.sendRawTransaction(txn.serialize());
  await connection.confirmTransaction(txid);
  return txid;
}

async function autoTradeLoop() {
  const tokens = await getTokens();
  const sol = tokens.find(t => t.symbol === 'SOL');
  const targets = tokens.filter(t => t.symbol !== 'SOL' && t.tags?.includes('popular')).slice(0, 10);

  for (const token of targets) {
    try {
      const buy = await getQuote(sol.address, token.address, AMOUNT);
      if (!buy) continue;

      const sell = await getQuote(token.address, sol.address, buy.outAmount);
      if (!sell) continue;

      const profit = ((sell.outAmount - AMOUNT) / AMOUNT) * 100;

      if (profit > THRESHOLD) {
        const swap1 = await getSwapTxn(sol.address, token.address, AMOUNT);
        const tx1 = await executeTxn(swap1);

        const swap2 = await getSwapTxn(token.address, sol.address, buy.outAmount);
        const tx2 = await executeTxn(swap2);

        logs.push({ token: token.symbol, profit, tx1, tx2, time: Date.now() });
        console.log(`✅ Swapped ${token.symbol} round-trip profit: ${profit.toFixed(2)}%`);
      }
    } catch (e) {
      console.log(`❌ Error on ${token.symbol}:`, e.message);
    }
  }
}

function getLogs() {
  return logs.slice(-50);
}

module.exports = { autoTradeLoop, getLogs };
                        
