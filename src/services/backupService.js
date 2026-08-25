import * as XLSX from "xlsx";
import { BACKUP_VERSION } from "../utils/constants.js";

export function buildBackupPayload({ history, boxes, movements, rows, headers, selectedSheets, idColumn, displayColumns }) {
  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    history: history || [],
    boxes: boxes || [],
    movements: movements || [],
    rows: rows || [],
    headers: headers || [],
    selectedSheets: selectedSheets || [],
    idColumn: idColumn || "",
    displayColumns: displayColumns || []
  };
}

export function exportFullBackup(payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json"
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const now = new Date();
  anchor.href = url;
  anchor.download = `ACHD_Backup_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
