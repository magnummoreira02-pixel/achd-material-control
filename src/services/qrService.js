import * as XLSX from "xlsx";

export function readSpreadsheetFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
    reader.onload = () => {
      try {
        const workbook = XLSX.read(reader.result, { type: "array" });
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
            rows.push({ ...record, __sheetName: name });
          });
        });

        if (!rows.length) {
          reject(new Error("A planilha não contém dados legíveis."));
          return;
        }

        headers = Object.keys(rows[0]).filter((h) => h !== "__sheetName");
        resolve({ sheets: parsedSheets, headers, rows });
      } catch (error) {
        reject(error);
      }
    };
    reader.readAsArrayBuffer(file);
  });
}
