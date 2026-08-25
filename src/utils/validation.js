export function normalizeValue(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export function guessIdColumn(headers = []) {
  const candidates = [
    "codigo",
    "codigo material",
    "cod material",
    "material",
    "sku",
    "qr code",
    "qrcode",
    "id"
  ];
  for (const header of headers) {
    if (candidates.includes(normalizeValue(header))) return header;
  }
  for (const header of headers) {
    const n = normalizeValue(header);
    if (n.includes("cod") || n.includes("material") || n.includes("item")) {
      return header;
    }
  }
  return headers[0] || "";
}

export function getAvancoStatus(row = {}) {
  const entry = Object.entries(row).find(([key]) =>
    ["avanco", "avanço"].includes(normalizeValue(key))
  );
  if (!entry) return ""; // planilha não tem coluna de avanço
  const value = normalizeValue(entry[1]);
  if (["sim", "ok", "concluido", "concluído", "feito", "true", "1"].includes(value)) {
    return "sim";
  }
  // qualquer outro valor (vazio, "não", "descarte", "pendente"...) conta como vermelho
  return "nao";
}

// Lê o Número de Ordem já existente na planilha, na mesma linha do material.
// Não calcula, não usa índice/posição/ID: apenas localiza a coluna de ordem
// (pelo nome do cabeçalho) e devolve o valor exatamente como está na planilha.
export function getOrderNumber(row = {}) {
  if (!row) return "";
  const exactCandidates = [
    "ordem",
    "numero de ordem",
    "número de ordem",
    "num ordem",
    "n ordem",
    "nº ordem",
    "ordem de separacao",
    "ordem de separação",
    "ordem separacao",
    "ordem separação"
  ];
  const exact = Object.entries(row).find(([key]) =>
    exactCandidates.includes(normalizeValue(key))
  );
  if (exact) return exact[1];
  // fallback: qualquer cabeçalho que contenha "ordem" (ex.: "Ordem separação")
  const partial = Object.entries(row).find(([key]) => normalizeValue(key).includes("ordem"));
  return partial ? partial[1] : "";
}

export function getManualHighlightColor(row, highlightedFields, color) {
  if (!row || !highlightedFields?.length) return "";
  const hasMatch = highlightedFields.some((field) => {
    const value = row[field];
    return value !== undefined && String(value).trim() !== "";
  });
  return hasMatch ? color : "";
}

export function getCodeColorRule(code, codeColorRules = []) {
  const normalizedCode = normalizeValue(code);
  if (!normalizedCode) return null;
  // prefixos mais longos primeiro, para evitar que um prefixo curto "roube" o match
  const sorted = [...codeColorRules].sort((a, b) => (b.prefix?.length || 0) - (a.prefix?.length || 0));
  return sorted.find((rule) => rule.prefix && normalizedCode.startsWith(normalizeValue(rule.prefix))) || null;
}

export function getRowColor(sheetName, row, colorRules) {
  if (!colorRules) return "";
  const status = getAvancoStatus(row);
  if (status === "sim" && colorRules.avanco?.sim) return colorRules.avanco.sim;
  if (status === "nao" && colorRules.avanco?.nao) return colorRules.avanco.nao;
  return "";
}
