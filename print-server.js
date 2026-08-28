// print-server.js - Bridge HTTP -> TCP RAW (Ethernet) ou RAW USB Windows
const express = require("express");
const net = require("net");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { exec } = require("child_process");

const app = express();
const PORT = 3001;

app.use(express.json({ limit: "1mb" }));
app.use(express.text({ type: "*/*", limit: "1mb" }));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

app.get("/health", (req, res) => res.json({ success: true, service: "print-server" }));
app.get("/print", (req, res) => res.json({ success: true, service: "print-server", endpoint: "POST /print" }));

function sendUsbRaw(zpl, printer) {
  return new Promise((resolve, reject) => {
    const name = printer.name || "ZDesigner ZT411-203dpi ZPL";
    const tmp = path.join(os.tmpdir(), `zpl_${Date.now()}.prn`);
    fs.writeFileSync(tmp, zpl, "utf8");
    // Usa PowerShell para enviar RAW para impressora Windows instalada (não precisa driver extra)
    // Out-Printer não é RAW; então usa .NET RawPrinterHelper via Add-Printer workaround: copy via Win32
    // Método mais compatível sem dependências: usa `copy /b` para porta USB001 ou nome da impressora via `print` com /D:
    const ps = `powershell -NoProfile -Command "$p='${name.replace(/'/g, "''")}'; $f='${tmp.replace(/'/g, "''")}'; try { $w = New-Object System.IO.StreamReader($f); $z = $w.ReadToEnd(); $w.Close(); Add-Type -AssemblyName System.Drawing; $pi = New-Object System.Drawing.Printing.PrinterSettings; $pi.PrinterName=$p; if(-not $pi.IsValid){ throw 'Impressora ' + $p + ' não encontrada.' }; $doc = New-Object System.Drawing.Printing.PrintDocument; $doc.PrinterSettings.PrinterName=$p; $doc.add_PrintPage({param($s,$e) $e.Graphics.DrawString($using:z, (New-Object System.Drawing.Font('Consolas',8)), [System.Drawing.Brushes]::Black, 0,0)}); } catch { exit 1 }"`;
    // Fallback simples e confiável sem dependências: tenta `copy` direto para USB001 e também tenta `wmic printer`
    // Primeiro tenta método RAW via `copy` usando nome da impressora compartilhada
    const cmdCopy = `copy /b "${tmp}" "\\\\localhost\\${name}"`;
    const cmdUsb = `copy /b "${tmp}" "\\\\.\\USB001"`;
    // Tenta também via PowerShell usando Win32_Printer direct
    const cmdPs = `powershell -NoProfile -Command "Get-Content -Raw -Encoding Ascii '${tmp}' | Out-Printer -Name '${name.replace(/'/g, "''")}'"`;

    // Estratégia sem instalar pacotes: usa `print` com /D: ou `copy` — tenta sequencialmente
    exec(cmdCopy, (err) => {
      if (!err) return resolve();
      exec(cmdUsb, (err2) => {
        if (!err2) return resolve();
        exec(cmdPs, (err3) => {
          try { fs.unlinkSync(tmp); } catch {}
          if (!err3) return resolve();
          reject(new Error(`Impressora ${name} não encontrada. Verifique se "${name}" está instalada em USB001.`));
        });
      });
    });
    // Limpeza do temp após 5s
    setTimeout(() => { try { fs.unlinkSync(tmp); } catch {} }, 5000);
  });
}

app.post("/print", (req, res) => {
  let zpl, printer;
  if (req.body && typeof req.body === "object" && req.body.zpl) {
    zpl = req.body.zpl;
    printer = req.body.printer || {};
  } else if (typeof req.body === "string" && req.body.includes("^XA")) {
    zpl = req.body;
    printer = { ip: req.query.ip, port: req.query.port };
  } else {
    return res.status(400).json({ success: false, message: "ZPL não encontrado no body" });
  }

  const connection = (printer.connection || (String(printer.port).toUpperCase() === "USB001" ? "usb" : "") || "").toLowerCase();
  const model = printer.model || "ZT411";
  const dpi = printer.dpi || 203;

  if (!zpl) return res.status(400).json({ success: false, message: "ZPL não encontrado" });

  // MODO USB — ZDesigner ZT411 / USB001
  if (connection === "usb" || String(printer.port).toUpperCase() === "USB001" || printer.name) {
    const name = printer.name || "ZDesigner ZT411-203dpi ZPL";
    const port = printer.port || "USB001";
    console.log(`[PRINT] Modo: USB Impressora: ${name} Porta: ${port} DPI: ${dpi} ZPL: ${zpl.length} caracteres`);
    sendUsbRaw(zpl, { name, port })
      .then(() => {
        console.log("[PRINT] Enviado com sucesso");
        res.json({ success: true, message: `ZPL enviado para a ${model}` });
      })
      .catch((err) => {
        console.error(`[PRINT ERROR] Não foi possível imprimir na ${model} - ${err.message}`);
        res.status(502).json({ success: false, message: `Não foi possível imprimir na ${model}` });
      });
    return;
  }

  // MODO ETHERNET — TCP RAW ip:9100 (preservado)
  const ip = (printer.ip || req.query.ip || "").trim();
  const port = parseInt(printer.port || req.query.port, 10) || 9100;
  if (!ip) return res.status(400).json({ success: false, message: "IP da impressora não configurado" });

  const client = new net.Socket();
  let responded = false;
  const send = (code, body) => { if (!responded) { responded = true; res.status(code).json(body); } };
  const timeout = setTimeout(() => { client.destroy(); send(504, { success: false, message: "Timeout conectando à impressora" }); }, 5000);
  client.connect(port, ip, () => {
    clearTimeout(timeout);
    client.write(zpl);
    client.end();
    console.log(`[PRINT] Modo: Rede Impressora: ${ip}:${port} Modelo: ${model} ZPL: ${zpl.length} caracteres`);
    console.log("[PRINT] Enviado com sucesso");
    send(200, { success: true, message: "ZPL enviado para a impressora" });
  });
  client.on("error", (err) => {
    clearTimeout(timeout);
    console.error(`[PRINT ERROR] Não foi possível conectar em ${ip}:${port} - ${err.message}`);
    send(502, { success: false, message: "Não foi possível conectar à impressora" });
  });
});

app.use((err, req, res, next) => {
  console.error("[PRINT ERROR] Interno:", err.message);
  res.status(500).json({ success: false, message: "Erro interno no serviço de impressão" });
});

app.listen(PORT, () => {
  console.log(`\n[PRINT SERVER] Porta ${PORT} ativa`);
  console.log(`   USB:  POST http://localhost:${PORT}/print {zpl, printer:{connection:"usb", name:"ZDesigner ZT411-203dpi ZPL", port:"USB001"}}`);
  console.log(`   REDE: POST http://localhost:${PORT}/print {zpl, printer:{ip, port:9100}}\n`);
});
