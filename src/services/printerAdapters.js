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
  if (!zpl) throw new Error("ZPL não gerado.");
  const isUsb = (printerConfig?.connection || "").toLowerCase() === "usb" || String(printerConfig?.port || "").toUpperCase() === "USB001";
  if (!isUsb) {
    const ip = (printerConfig?.ip || "").trim();
    if (!ip) throw new Error("Informe o IP da impressora Zebra.");
  }
  try {
    const payload = { zpl, printer: { ip: printerConfig.ip || "", port: printerConfig.port || (isUsb ? "USB001" : 9100), model: printerConfig.model, dpi: printerConfig.dpi, connection: printerConfig.connection || (isUsb ? "usb" : "network"), name: printerConfig.name || "ZDesigner ZT411-203dpi ZPL" } };
    const res = await fetch("http://localhost:3001/print", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
    if (data.success === false) throw new Error(data.message || "Falha no serviço");
    return { ok: true, message: data.message || "ZPL enviado para a impressora" };
  } catch (e) {
    if (e.message.includes("Failed to fetch") || e.message.includes("fetch")) {
      throw new Error("Serviço de impressão indisponível. Inicie com: npm run print-server");
    }
    throw e;
  }
}
