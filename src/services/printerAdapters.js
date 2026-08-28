import { generateZplLabel } from "./zplGenerator.js";
import { printLabels } from "./boxLabelService.js";

export async function commonPrint({ payload, labelSize, quantity, qrDataUrl }) {
  printLabels({ payload, labelSize, quantity, qrDataUrl });
  return { ok: true, message: "Etiqueta enviada para a impressora padrão." };
}

export function thermalPrintZpl({ payload, labelSize, printerConfig, quantity = 1 }) {
  const zpl = generateZplLabel({ payload, labelSize, printerConfig, quantity });
  return { zpl, printerConfig };
}

export function validatePrintRequest({ payload, labelSize, printerConfig }) {
  if (!payload?.id || !payload?.number) throw new Error("Caixa sem identificação.");
  if (!labelSize?.width || !labelSize?.height) throw new Error("Tamanho de etiqueta inválido.");
  if (!printerConfig) throw new Error("Impressora não configurada.");
  const zpl = generateZplLabel({ payload, labelSize, printerConfig });
  if (!zpl || !zpl.includes("^XA")) throw new Error("ZPL inválido.");
  return zpl;
}

export async function testPrint({ payload, labelSize, printerConfig }) {
  const zpl = validatePrintRequest({ payload, labelSize, printerConfig });
  return { ok: true, zpl, message: "Teste: ZPL válido, comunicação pronta." };
}

export async function testConnection(opts) {
  return testPrint(opts);
}

export async function sendToPrinterService({ zpl, printerConfig }) {
  const ip = printerConfig.ip?.trim();
  const port = printerConfig.port || 9100;
  if (ip) {
    try {
      const res = await fetch(`http://${ip}:${port}/print`, { method: "POST", headers: { "Content-Type": "text/plain" }, body: zpl });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return { ok: true, message: "Etiqueta enviada para a impressora térmica." };
    } catch (e) {
      throw new Error(`Não foi possível enviar para ${ip}:${port} — ${e.message}`);
    }
  }
  try {
    const res = await fetch("http://localhost:3001/print", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ zpl, printer: printerConfig }) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return { ok: true, message: "Etiqueta enviada via serviço local." };
  } catch {
    throw new Error("Serviço de impressão indisponível. ZPL gerado — copie e envie via BarTender/driver.");
  }
}
