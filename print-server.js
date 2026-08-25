// print-server.js - Proxy para impressão em rede (Zebra via socket RAW)
// Rode: node print-server.js
// Requer: npm install express

const express = require("express");
const net = require("net");

const app = express();
const PORT = 3001;

app.use(express.text({ type: "*/*", limit: "1mb" }));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

app.post("/print", (req, res) => {
  const ip = req.query.ip;
  const port = parseInt(req.query.port) || 9100;
  const zpl = req.body;

  if (!ip) return res.status(400).send("IP obrigatório (query param ?ip=)");

  const client = new net.Socket();
  const timeout = setTimeout(() => {
    client.destroy();
    res.status(504).send("Timeout conectando à impressora");
  }, 5000);

  client.connect(port, ip, () => {
    clearTimeout(timeout);
    client.write(zpl);
    client.end();
    console.log(`[${new Date().toISOString()}] ZPL enviado para ${ip}:${port}`);
    res.send("OK");
  });

  client.on("error", (err) => {
    clearTimeout(timeout);
    console.error(`Erro ${ip}:${port}:`, err.message);
    res.status(502).send("Erro conexão: " + err.message);
  });
});

app.listen(PORT, () => {
  console.log(`\n🖨️  Print Server rodando em http://localhost:${PORT}`);
  console.log(`   Uso: POST http://localhost:${PORT}/print?ip=192.168.1.100&port=9100`);
  console.log(`   Body: ZPL raw text\n`);
});