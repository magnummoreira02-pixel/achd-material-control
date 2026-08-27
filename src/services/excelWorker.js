import * as XLSX from "xlsx";

self.onmessage = (event) => {
  try {
    const { buffer, sheetName } = event.data || {};

    // Modo 2: ler apenas uma aba específica
    if (sheetName) {
      const workbook = XLSX.read(new Uint8Array(buffer), { type: "array" });
      if (!workbook.SheetNames.includes(sheetName)) {
        throw new Error(`Aba "${sheetName}" não encontrada no arquivo.`);
      }
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) throw new Error("Não foi possível ler a aba selecionada.");
      const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      if (!json.length) throw new Error("A aba selecionada não contém dados legíveis.");
      const rows = json.map((record) => ({ ...record, __sheetName: sheetName }));
      const headers = Object.keys(rows[0]).filter((h) => h !== "__sheetName");
      self.postMessage({ sheetName, headers, rows });
      return;
    }

    // Modo 1 (padrão): ler workbook completo — retorna sheets + headers + rows (compatível com fluxo atual)
    // Também serve para listar abas (o caller usa data.sheets)
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
    if (!rows.length) throw new Error("A planilha não contém dados legíveis.");
    const headers = Object.keys(rows[0]).filter((h) => h !== "__sheetName");
    self.postMessage({ sheets: parsedSheets, headers, rows });
  } catch (error) {
    self.postMessage({ error: error?.message || "Não foi possível ler este arquivo." });
  }
};
