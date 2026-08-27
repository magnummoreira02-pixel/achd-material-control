import QRCode from "qrcode";

export function getBoxLabelPayload(box) {
  if (!box) return null;
  return {
    id: box.id,
    number: String(box.number).padStart(3, "0"),
    description: box.description || "",
    status: box.status || "",
    createdAt: box.createdAt || "",
    count: (box.materials || []).length,
    qrValue: `CAIXA:${String(box.number).padStart(3, "0")}`,
  };
}

export async function generateQrDataUrl(text, size = 180) {
  try {
    return await QRCode.toDataURL(text, {
      width: size,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#111827", light: "#FFFFFF" },
    });
  } catch {
    return "";
  }
}

export function printLabels({ payload, labelSize, quantity, qrDataUrl }) {
  const qty = Math.max(1, Math.min(99, Number(quantity) || 1));
  const { width, height, unit } = labelSize;
  const copies = Array.from({ length: qty }, () => payload);

  const labelHtml = copies.map((p) => {
    if (labelSize.id === "45x18") {
      return `
        <div class="label" style="width:${width}${unit};height:${height}${unit};">
          <div class="label-45x18">
            <span class="box-code">CAIXA ${p.number}</span>
            <img class="qr" src="${qrDataUrl}" alt="QR CAIXA ${p.number}" />
          </div>
        </div>`;
    }
    if (labelSize.id === "50x50") {
      return `
        <div class="label" style="width:${width}${unit};height:${height}${unit};">
          <div class="label-50x50">
            <span class="box-code">CAIXA ${p.number}</span>
            <img class="qr" src="${qrDataUrl}" alt="QR CAIXA ${p.number}" />
            <span class="box-meta">${p.description ? p.description : "LRV"}${p.description ? " · " + (p.count + " itens") : ""}</span>
          </div>
        </div>`;
    }
    // 100x100
    return `
      <div class="label" style="width:${width}${unit};height:${height}${unit};">
        <div class="label-100x100">
          <span class="box-code">CAIXA ${p.number}</span>
          <img class="qr" src="${qrDataUrl}" alt="QR CAIXA ${p.number}" />
          <span class="box-meta">LRV${p.description ? " · " + p.description : ""}</span>
          <span class="box-extra">${p.count} itens${p.createdAt ? " · " + p.createdAt : ""}</span>
        </div>
      </div>`;
  }).join("");

  const printRoot = document.getElementById("box-label-print-root");
  if (!printRoot) return;
  printRoot.innerHTML = labelHtml;

  // Classe que esconde o resto no @media print
  document.body.classList.add("printing-box-label");
  const cleanup = () => {
    document.body.classList.remove("printing-box-label");
    window.removeEventListener("afterprint", cleanup);
  };
  window.addEventListener("afterprint", cleanup);
  window.print();
  // Fallback se afterprint não disparar
  setTimeout(cleanup, 1000);
}

// Adapter preparado para futura integração Zebra/BarTender
export const PrintAdapters = {
  BROWSER: "browser",
  ZPL: "zpl",
  BARTENDER: "bartender",
};
