import { mmToDots } from "../utils/printerConfig.js";

function esc(s) {
  return String(s).replace(/[\^~]/g, "");
}

export function generateZplLabel({ payload, labelSize, printerConfig }) {
  const dpi = Number(printerConfig?.dpi) || 203;
  const w = mmToDots(labelSize.width, dpi);
  const h = mmToDots(labelSize.height, dpi);
  const copies = 1;
  const qrValue = esc(payload.qrValue);

  // Posições proporcionais por tamanho
  let zpl = `^XA
^CI28
^PW${w}
^LL${h}
^LH0,0
`;

  if (labelSize.id === "45x18") {
    const qrSize = 4; // módulo
    const qrX = w - mmToDots(15, dpi);
    const qrY = mmToDots(1.5, dpi);
    zpl += `^FO${mmToDots(2, dpi)},${mmToDots(2, dpi)}^A0N,${mmToDots(3.2, dpi)},${mmToDots(3.2, dpi)}^FDCAIXA ${esc(payload.number)}^FS
^FO${qrX},${qrY}^BQN,2,${qrSize}^FDLA,${qrValue}^FS
`;
  } else if (labelSize.id === "50x50") {
    const qrDots = mmToDots(22, dpi);
    const qrX = Math.round((w - qrDots) / 2);
    zpl += `^FO${Math.round(w / 2 - 40)},${mmToDots(4, dpi)}^A0N,${mmToDots(4, dpi)},${mmToDots(4, dpi)}^FB${w},1,0,C^FDCAIXA ${esc(payload.number)}^FS
^FO${qrX},${mmToDots(12, dpi)}^BQN,2,5^FDLA,${qrValue}^FS
^FO0,${mmToDots(38, dpi)}^A0N,${mmToDots(2.5, dpi)},${mmToDots(2.5, dpi)}^FB${w},1,0,C^FDLRV^FS
`;
  } else {
    const qrDots = mmToDots(34, dpi);
    const qrX = Math.round((w - qrDots) / 2);
    zpl += `^FO0,${mmToDots(5, dpi)}^A0N,${mmToDots(5, dpi)},${mmToDots(5, dpi)}^FB${w},1,0,C^FDCAIXA ${esc(payload.number)}^FS
^FO${qrX},${mmToDots(16, dpi)}^BQN,2,6^FDLA,${qrValue}^FS
^FO0,${mmToDots(58, dpi)}^A0N,${mmToDots(3, dpi)},${mmToDots(3, dpi)}^FB${w},1,0,C^FDLRV${payload.description ? " - " + esc(payload.description) : ""}^FS
^FO0,${mmToDots(66, dpi)}^A0N,${mmToDots(2.5, dpi)},${mmToDots(2.5, dpi)}^FB${w},1,0,C^FD${payload.count} itens${payload.createdAt ? " - " + esc(payload.createdAt) : ""}^FS
`;
  }

  zpl += `^PQ${copies}
^XZ`;
  return zpl;
}
