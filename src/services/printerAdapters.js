import { generateZplLabel } from "./zplGenerator.js";
import { printLabels } from "./boxLabelService.js";

export async function commonPrint({ payload, labelSize, quantity, qrDataUrl }) {
  printLabels({ payload, labelSize, quantity, qrDataUrl });
  return { ok: true, message: "Etiqueta enviada para a impressora padrão." };
}

export function thermalPrintZpl({ payload, labelSize, printerConfig }) {
  const zpl = generateZplLabel({ payload, labelSize, printerConfig });
  return { zpl, printerConfig };
}

export async function sendToPrinterService({ zpl, printerConfig }) {
  // Arquitetura: FRONTEND -> SERVIÇO DE IMPRESSÃO -> IMPRESSORA
  // Tenta serviço local (ex: print-server.js); se indisponível, retorna erro controlado
  const ip = printerConfig.ip?.trim();
  const port = printerConfig.port || 9100;
  // Se IP configurado, tenta endpoint local genérico
  if (ip) {
    try {
      const res = await fetch(`http://${ip}:${port}/print`, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: zpl,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return { ok: true, message: "Etiqueta enviada para a impressora térmica." };
    } catch (e) {
      throw new Error(`Não foi possível enviar para ${ip}:${port} — ${e.message}`);
    }
  }
  // Sem IP: tenta print-server local em localhost:3001 (se existir)
  try {
    const res = await fetch("http://localhost:3001/print", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ zpl, printer: printerConfig }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return { ok: true, message: "Etiqueta enviada via serviço local." };
  } catch {
    // Sem serviço: não trava o app — informa que ZPL foi gerado
    throw new Error("Serviço de impressão indisponível. ZPL gerado — copie e envie via BarTender/driver.");
  }
}
