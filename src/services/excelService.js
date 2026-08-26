import * as XLSX from "xlsx";
import { normalizeValue } from "../utils/validation.js";
import { getExportFileName } from "../utils/formatting.js";

// Parse síncrono (fallback quando Web Worker não está disponível)
function parseSpreadsheetBuffer(buffer) {
  const workbook = XLSX.read(new Uint8Array(buffer), { type: "array" });
  const parsedSheets = [];
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

  const headers = Object.keys(rows[0]).filter((h) => h !== "__sheetName");
  return { sheets: parsedSheets, headers, rows };
}

// Parse em Web Worker: mantém a UI fluida com planilhas muito grandes.
// Cai para o parse síncrono se o Worker falhar.
function parseInWorker(buffer) {
  return new Promise((resolve, reject) => {
    let worker;
    try {
      worker = new Worker(new URL("./excelWorker.js", import.meta.url), { type: "module" });
    } catch (error) {
      reject(error);
      return;
    }
    worker.onmessage = (event) => {
      worker.terminate();
      const data = event.data || {};
      if (data.error) {
        reject(new Error(data.error));
      } else {
        resolve(data);
      }
    };
    worker.onerror = () => {
      worker.terminate();
      reject(new Error("worker-failed"));
    };
    worker.postMessage({ buffer }, [buffer]);
  });
}

export async function readSpreadsheetFile(file) {
  const buffer = await file.arrayBuffer();
  if (typeof Worker !== "undefined") {
    try {
      // buffer é transferido ao worker; clona para preservar o original no fallback
      return await parseInWorker(buffer.slice(0));
    } catch (error) {
      if (error?.message !== "worker-failed") {
        throw error;
      }
      // worker indisponível: segue com parse síncrono
    }
  }
  return parseSpreadsheetBuffer(buffer);
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

// ---------------------------------------------------------------------------
// Progresso da Conferência de Ensaio
// ---------------------------------------------------------------------------

const CONF_STATUS_SHEET = "CONFERENCIA STATUS";
const MIME_XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const CONF_OPTIONAL_LABELS = {
  quadra: "QUADRA",
  entry: "ENTRY",
  entryPrefix: "ENTRY PREFIX",
  entrySuffix: "ENTRY SUFFIX",
  rep: "REP",
  bookName: "BOOK NAME",
  plantador: "PLANTADOR",
  sentido: "SENTIDO"
};

/**
 * Monta as linhas da aba CONFERENCIA STATUS: uma linha por item da sequência
 * de bipagem, com status por posição (CONFERIDO / AGUARDANDO / PENDENTE),
 * último evento registrado no histórico e data/hora do último bip.
 */
export function buildConferenciaStatusRows(sequence = [], columnMap = {}, position = 0, historyRecords = [], filterCtx = {}) {
  // Último evento por (contexto de filtros + ID bipado). O histórico chega
  // mais novo primeiro, então a primeira ocorrência já é a mais recente.
  const latestByContextAndId = new Map();
  for (const record of historyRecords || []) {
    const idKey = normalizeValue(record.bipadoId);
    if (!idKey) continue;
    const ctxKey = [
      record.local ?? "",
      record.tipoPlantio ?? "",
      record.plantador ?? "",
      record.quadra ?? "",
      record.row ?? ""
    ].join("||");
    const mapKey = `${ctxKey}|${idKey}`;
    if (!latestByContextAndId.has(mapKey)) latestByContextAndId.set(mapKey, record);
  }
  const currentContext = [
    filterCtx.local ?? "",
    filterCtx.tipoPlantio ?? "",
    filterCtx.plantador ?? "",
    filterCtx.quadra ?? "",
    filterCtx.row ?? ""
  ].join("||");

  return sequence.map((record, index) => {
    const event =
      latestByContextAndId.get(`${currentContext}|${normalizeValue(record[columnMap.id])}`) || null;
    const row = {
      ORDEM: index + 1,
      ID: record[columnMap.id] ?? "",
      RANGE: record[columnMap.range] ?? "",
      ROW: columnMap.row ? record[columnMap.row] ?? "" : ""
    };
    for (const [key, label] of Object.entries(CONF_OPTIONAL_LABELS)) {
      if (columnMap[key]) row[label] = record[columnMap[key]] ?? "";
    }
    row["TIPO DE PLANTIO"] = filterCtx.tipoPlantio || "";
    row.STATUS = index < position ? "CONFERIDO" : index === position ? "AGUARDANDO" : "PENDENTE";
    row["ULTIMO EVENTO"] = event ? event.status : "";
    row["DATA BIP"] = "";
    row["HORA BIP"] = "";
    if (event?.timestamp && !isNaN(new Date(event.timestamp))) {
      const stampDate = new Date(event.timestamp);
      row["DATA BIP"] = stampDate.toLocaleDateString("pt-BR");
      row["HORA BIP"] = stampDate.toLocaleTimeString("pt-BR", { hour12: false });
    }
    return row;
  });
}

/**
 * Monta o workbook completo do progresso: cada aba original da planilha
 * importada é recriada e ao final entra a aba CONFERENCIA STATUS.
 */
export function buildConferenciaFullWorkbook({ originalRows = [], statusRows = [] }) {
  const workbook = XLSX.utils.book_new();
  const groups = new Map();
  for (const originalRow of originalRows || []) {
    const sheetName = String(originalRow.__sheetName || "PLANILHA");
    if (!groups.has(sheetName)) groups.set(sheetName, []);
    const copy = { ...originalRow };
    delete copy.__sheetName;
    groups.get(sheetName).push(copy);
  }

  const usedNames = new Set();
  for (const [name, sheetRows] of groups.entries()) {
    let sheetName = sanitizeSheetName(name);
    let suffix = 1;
    while (usedNames.has(sheetName)) {
      sheetName = sanitizeSheetName(`${name} (${suffix++})`);
    }
    usedNames.add(sheetName);
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(sheetRows), sheetName);
  }

  let statusName = CONF_STATUS_SHEET;
  let statusSuffix = 1;
  while (usedNames.has(statusName)) {
    statusName = sanitizeSheetName(`${CONF_STATUS_SHEET} (${statusSuffix++})`);
  }
  const statusContent = statusRows.length ? statusRows : [{ AVISO: "Nenhuma sequência de conferência ativa." }];
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(statusContent), statusName);

  return workbook;
}

/**
 * Gera o arquivo Excel completo do progresso (abas originais + CONFERENCIA STATUS)
 * e dispara o download no navegador.
 * @returns {string} nome do arquivo gerado
 */
export function downloadConferenciaProgressWorkbook({
  originalRows,
  sequence,
  columnMap,
  position,
  historyRecords,
  filterCtx
}) {
  const statusRows = buildConferenciaStatusRows(sequence, columnMap, position, historyRecords, filterCtx);
  const workbook = buildConferenciaFullWorkbook({ originalRows, statusRows });
  const fileName = getExportFileName("xlsx", "Conferencia_Progresso");
  downloadBlob(
    new Blob([XLSX.write(workbook, { bookType: "xlsx", type: "array" })], { type: MIME_XLSX }),
    fileName
  );
  return fileName;
}

/**
 * Atualiza Progresso_Conferencia.xlsx dentro da pasta escolhida pelo usuário
 * (File System Access API), contendo somente a aba CONFERENCIA STATUS.
 * Chamado a cada bipagem quando o auto-salvamento está ativo.
 * @returns {Promise<boolean>} true se gravou com sucesso
 */
export async function writeConferenciaProgressToDirectory(dirHandle, statusRows = []) {
  if (!dirHandle) return false;
  try {
    const workbook = XLSX.utils.book_new();
    const content = statusRows.length ? statusRows : [{ AVISO: "Nenhuma sequência de conferência ativa." }];
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(content), sanitizeSheetName(CONF_STATUS_SHEET));
    const blob = new Blob([XLSX.write(workbook, { bookType: "xlsx", type: "array" })], { type: MIME_XLSX });
    const fileHandle = await dirHandle.getFileHandle("Progresso_Conferencia.xlsx", { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(blob);
    await writable.close();
    return true;
  } catch (error) {
    console.warn("Falha ao gravar o progresso da conferência na pasta.", error);
    return false;
  }
}
