export function mmToDots(mm, dpi) {
  return Math.round((Number(mm) * Number(dpi)) / 25.4);
}

export const ZEBRA_PRINTERS = {
  ZD220: { manufacturer: "Zebra", model: "ZD220", language: "ZPL", dpi: 203 },
  ZT410: { manufacturer: "Zebra", model: "ZT410", language: "ZPL", dpi: 203 },
  ZT411: { manufacturer: "Zebra", model: "ZT411", language: "ZPL", dpi: 203 },
};

export const PRINTER_TYPES = {
  COMMON: "common",
  THERMAL: "thermal",
};

export const DEFAULT_PRINTER_CONFIG = {
  type: PRINTER_TYPES.COMMON,
  manufacturer: "Zebra",
  model: "ZD220",
  language: "ZPL",
  dpi: 203,
  connection: "usb",
  ip: "",
  port: 9100,
};

export function resolvePrinterConfig(partial = {}) {
  const base = { ...DEFAULT_PRINTER_CONFIG, ...partial };
  if (base.type === PRINTER_TYPES.THERMAL && base.manufacturer === "Zebra") {
    const preset = ZEBRA_PRINTERS[base.model];
    if (preset) {
      base.language = preset.language;
      if (!partial.dpi) base.dpi = preset.dpi;
    }
  }
  return base;
}
