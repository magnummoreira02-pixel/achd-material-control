// Leitura de peso para a Toledo 9094 Plus via Web Serial.
// Configure a balança para transmitir Prt2 ou P06A continuamente.

export function parseToledoWeight(message) {
  const cleaned = String(message || "").replace(/[\x00-\x1F]/g, " ").trim();
  const p06a = cleaned.match(/^([EINS])\s*([+-]?\d+[.,]\d+)/i);
  // No P06A, somente "E" representa peso estável e seguro para registrar.
  if (p06a && p06a[1].toUpperCase() !== "E") return null;
  const match = p06a || cleaned.match(/([+-]?\d+[.,]\d+)/);
  if (!match) return null;
  const numericValue = p06a ? p06a[2] : match[1];
  const value = Number.parseFloat(numericValue.replace(",", "."));
  return Number.isFinite(value) ? value : null;
}

export function serialIsAvailable() {
  return typeof navigator !== "undefined" && Boolean(navigator.serial);
}
