import * as XLSX from "xlsx";
import { normalizeValue } from "../utils/validation.js";
import { getExportFileName } from "../utils/formatting.js";

export async function readSpreadsheetFile(file) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const parsedSheets = [];
  let headers = [];
  let rows = [];

  workbook.SheetNames.forEach((name) => {
    const sheet = workbook.Sheets[name];
    if (!sheet) return;
    const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });
    if (!json.length) return;
    parsedSheets.push({ name, count: json.length });
    json.forEach((record) => {
      const row = { ...record, __sheetName: name };
      rows.push(row);
    });
  });

  if (!rows.length) {
    throw new Error("A planilha não contém dados legíveis.");
  }

  headers = Object.keys(rows[0]).filter((h) => h !== "__sheetName");
  return { sheets: parsedSheets, headers, rows };
}

export function buildBipagensRows(history, displayColumns = [], boxes = []) {
  return history.map((item) => {
    const box = boxes.find((candidate) =>
      (candidate.materials || []).some(
        (material) => normalizeValue(material.code) === normalizeValue(item.code)
      )
    );
    return {
      Codigo: item.code,
      Descricao: displayColumns[0] ? item.rowData?.[displayColumns[0]] || "" : "",
      Data: item.date,
      Hora: item.time,
      Status: item.status,
      Caixa: box?.number || ""
    };
  });
}

export function buildHistoryBlob(rowsToExport, format) {
  const worksheet = XLSX.utils.json_to_sheet(rowsToExport);
  if (format === "csv") {
    return XLSX.utils.sheet_to_csv(worksheet);
  }
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Bipagens");
  return workbook;
}

export function buildHistoryFileBlob(rowsToExport, format = "xlsx") {
  if (format === "csv") {
    return new Blob(["\ufeff" + buildHistoryBlob(rowsToExport, "csv")], {
      type: "text/csv;charset=utf-8"
    });
  }
  const workbook = buildHistoryBlob(rowsToExport, "xlsx");
  return new Blob([XLSX.write(workbook, { bookType: "xlsx", type: "array" })], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });
}

export function exportHistoryWorkbook(history, headers) {
  const rowsToExport = history.map((item) => ({
    Numero: item.number,
    Codigo: item.code,
    Status: item.status,
    Planilha: item.sheetName || "",
    Data: item.date,
    Hora: item.time
  }));
  const workbook = buildHistoryBlob(rowsToExport, "xlsx");
  downloadBlob(
    new Blob([XLSX.write(workbook, { bookType: "xlsx", type: "array" })], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    }),
    getExportFileName("xlsx", "Historico_Leituras")
  );
}

export function buildBoxRows(box) {
  return (box.materials || []).map((material, index) => {
    const rowData = material.row && Object.keys(material.row).length ? material.row : null;
    if (rowData) {
      // Traz todas as colunas originais da planilha + metadados de rastreio
      return {
        Item: index + 1,
        ...rowData,
        "Data Bipagem": material.date || "",
        "Hora Bipagem": material.time || ""
      };
    }
    return {
      Item: index + 1,
      Codigo: material.code,
      Descricao: material.description || "",
      Data: material.date || "",
      Hora: material.time || ""
    };
  });
}

// Sanitiza nome de aba do Excel: máx. 31 caracteres, sem caracteres inválidos
function sanitizeSheetName(name) {
  return String(name || "CAIXA")
    .replace(/[\\/?*[\]:]/g, "-")
    .slice(0, 31);
}

// Exporta TODAS as caixas cheias/finalizadas em um único arquivo .xlsx,
// com uma aba por caixa, trazendo todos os dados da planilha original.
export function exportClosedBoxesWorkbook(closedBoxes) {
  if (!closedBoxes?.length) return;
  const workbook = XLSX.utils.book_new();
  const usedNames = new Set();

  closedBoxes.forEach((box) => {
    const rowsToExport = buildBoxRows(box);
    if (!rowsToExport.length) return;
    let sheetName = sanitizeSheetName(`CAIXA ${box.number}`);
    let suffix = 1;
    while (usedNames.has(sheetName)) {
      sheetName = sanitizeSheetName(`CAIXA ${box.number} (${suffix++})`);
    }
    usedNames.add(sheetName);
    const worksheet = XLSX.utils.json_to_sheet(rowsToExport);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  });

  // Aba resumo com todos os itens de todas as caixas juntos
  const resumoRows = closedBoxes.flatMap((box) =>
    buildBoxRows(box).map((row) => ({ Caixa: box.number, ...row }))
  );
  if (resumoRows.length) {
    const resumoSheet = XLSX.utils.json_to_sheet(resumoRows);
    XLSX.utils.book_append_sheet(workbook, resumoSheet, "RESUMO");
  }

  const now = new Date();
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0")
  ].join("-");

  downloadBlob(
    new Blob([XLSX.write(workbook, { bookType: "xlsx", type: "array" })], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    }),
    `Caixas_Cheias_${stamp}.xlsx`
  );
}

export function exportBoxSpreadsheet(box, format = "xlsx") {
  const rowsToExport = buildBoxRows(box);
  if (!rowsToExport.length) {
    alert("Esta caixa não possui materiais para exportar.");
    return;
  }
  if (format === "csv") {
    const csv = XLSX.utils.json_to_sheet(rowsToExport);
    const csvText = "\ufeff" + XLSX.utils.sheet_to_csv(csv);
    downloadBlob(
      new Blob([csvText], { type: "text/csv;charset=utf-8" }),
      `CAIXA_${box.number}.csv`
    );
    return;
  }
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rowsToExport);
  XLSX.utils.book_append_sheet(workbook, worksheet, `CAIXA ${box.number}`);
  downloadBlob(
    new Blob([XLSX.write(workbook, { bookType: "xlsx", type: "array" })], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    }),
    `CAIXA_${box.number}.xlsx`
  );
}

export function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return fileName;
}
