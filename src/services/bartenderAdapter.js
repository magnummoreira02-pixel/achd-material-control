import { LABEL_SIZES } from "../utils/labelSizes.js";

const BARTENDER_TEMPLATES = {
  "45x18": "CAIXA_45x18.btw",
  "50x50": "CAIXA_50x50.btw",
  "100x100": "CAIXA_100x100.btw",
};

export function getBartenderTemplate(labelSize) {
  const id = labelSize?.id || "50x50";
  return BARTENDER_TEMPLATES[id] || BARTENDER_TEMPLATES["50x50"];
}

export function buildBartenderPayload({ payload, labelSize }) {
  // Campos variáveis do modelo .btw — segue padrão do projeto (BOX_NUMBER, QR_DATA)
  return {
    boxId: payload.id,
    boxNumber: `CAIXA ${payload.number}`,
    boxNumberRaw: payload.number,
    location: payload.description || "LRV",
    qrData: payload.qrValue, // CAIXA:001
    labelSize: labelSize.label,
    labelSizeId: labelSize.id,
    count: payload.count,
    createdAt: payload.createdAt || "",
    template: getBartenderTemplate(labelSize),
  };
}

export async function sendToBartender({ payload, labelSize, printerConfig }) {
  const data = buildBartenderPayload({ payload, labelSize });
  const template = data.template;

  // Arquitetura: APP -> SERVIÇO LOCAL -> BARTENDER -> IMPRESSORA
  // Tenta serviço local em localhost:3001/bartender (se existir)
  // Se BarTender não estiver disponível, lança erro controlado (não trava app)

  const endpoints = [];
  if (printerConfig?.ip) endpoints.push(`http://${printerConfig.ip}:${printerConfig.port || 3001}/bartender/print`);
  endpoints.push("http://localhost:3001/bartender/print");
  endpoints.push("http://localhost:3001/api/bartender/print");

  let lastError = null;
  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, printer: printerConfig, template }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json().catch(() => ({}));
      return { ok: true, message: body.message || `Etiqueta enviada ao BarTender (${template})`, template };
    } catch (e) {
      lastError = e;
    }
  }
  // Fallback: serviço indisponível — não simula impressão
  throw new Error(
    lastError?.message?.includes("Failed to fetch") || lastError?.message?.includes("fetch")
      ? "BarTender não disponível neste computador. Serviço local não encontrado."
      : `BarTender indisponível — ${lastError?.message || "verifique se o BarTender e o serviço local estão abertos."}`
  );
}

export const BartenderStatus = {
  PREPARANDO: "preparando",
  ENVIANDO: "enviando",
  ENVIADO: "enviado",
  ERRO: "erro",
};
