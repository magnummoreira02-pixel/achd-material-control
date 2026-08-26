// Web Worker: processa o arquivo Excel fora da thread principal,
// para que planilhas muito grandes não congelem a interface.
import * as XLSX from "xlsx";

self.onmessage = (event) => {
  try {
    const buffer = event.data?.buffer;
    const workbook = XLSX.read(new Uint8Array(buffer), { type: "array" });
    const parsedSheets = [];
    const rows = [];

    workbook.SheetNames.forEach((name) => {
      const sheet = workbook.Sheets[name];
      if (!sheet) return;
      const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      if (!json.length) return;
      parsedSheets.push({ name, count: json.length });
      json.forEach((record) => {
        rows.push({ ...record, __sheetName: name });
      });
    });

    if (!rows.length) {
      throw new Error("A planilha não contém dados legíveis.");
    }

    const headers = Object.keys(rows[0]).filter((h) => h !== "__sheetName");
    self.postMessage({ sheets: parsedSheets, headers, rows });
  } catch (error) {
    self.postMessage({ error: error?.message || "Não foi possível ler este arquivo." });
  }
};
