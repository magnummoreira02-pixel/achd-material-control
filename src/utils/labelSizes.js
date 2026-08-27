export const LABEL_SIZES = {
  "45x18": { id: "45x18", label: "45 × 18 mm", width: 45, height: 18, unit: "mm" },
  "50x50": { id: "50x50", label: "50 × 50 mm", width: 50, height: 50, unit: "mm" },
  "100x100": { id: "100x100", label: "100 × 100 mm", width: 100, height: 100, unit: "mm" },
};

export const LABEL_SIZE_IDS = Object.keys(LABEL_SIZES);
export const DEFAULT_LABEL_SIZE_ID = "45x18";

export function getLabelSize(id) {
  return LABEL_SIZES[id] || LABEL_SIZES[DEFAULT_LABEL_SIZE_ID];
}
