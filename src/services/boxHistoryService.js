const KEY = "box_print_history";

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
function save(arr) { try { localStorage.setItem(KEY, JSON.stringify(arr)); } catch {} }

export function addHistoryEntry(entry) {
  const arr = load();
  const rec = {
    id: entry.id || `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    boxNumber: String(entry.boxNumber || "").padStart(3, "0"),
    action: entry.action || "printed",
    printer: entry.printer || "ZT411",
    connection: entry.connection || "usb",
    quantity: Number(entry.quantity) || 1,
    timestamp: entry.timestamp || new Date().toISOString(),
    user: entry.user || "local",
    status: entry.status || "sent",
    trialId: entry.trialId || "",
  };
  arr.unshift(rec);
  save(arr);
  return rec;
}

export function getHistoryByBox(boxNumber) {
  const n = String(boxNumber).padStart(3, "0");
  return load().filter((r) => r.boxNumber === n);
}

export function getAllHistory() { return load(); }
