import { BACKUP_VERSION } from "../utils/constants.js";

const KEYS = {
  history: "ACHD_HISTORY_V1",
  boxes: "ACHD_BOXES_V1",
  movements: "ACHD_MOVEMENTS_V1",
  theme: "ACHD_THEME_V1"
};

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch (error) {
    console.warn(`Falha ao ler "${key}" do armazenamento local.`, error);
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Falha ao salvar "${key}" no armazenamento local.`, error);
  }
}

export function loadHistory() {
  return read(KEYS.history, []);
}

export function saveHistory(history) {
  write(KEYS.history, history || []);
}

export function removeHistory() {
  try {
    localStorage.removeItem(KEYS.history);
  } catch (error) {
    console.warn("Falha ao remover histórico.", error);
  }
}

export function loadBoxes() {
  return read(KEYS.boxes, []);
}

export function saveBoxes(boxes) {
  write(KEYS.boxes, boxes || []);
}

export function loadMovements() {
  return read(KEYS.movements, []);
}

export function saveMovements(movements) {
  write(KEYS.movements, movements || []);
}

export function loadTheme() {
  return read(KEYS.theme, "dark");
}

export function saveTheme(theme) {
  write(KEYS.theme, theme);
}

export { BACKUP_VERSION };
