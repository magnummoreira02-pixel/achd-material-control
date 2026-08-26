/**
 * Funções utilitárias para o módulo de Conferência de Ensaio
 */

/**
 * Retorna a direção esperada (CRESCENTE ou DECRESCENTE) com base no tipo de plantio e ROW
 * @param {string} tipoPlantio - "4 LINHAS", "8 LINHAS" ou "PLANTIO MANUAL"
 * @param {number|string} row - Número da row
 * @returns {"CRESCENTE"|"DECRESCENTE"}
 */
export function getConferenciaDirection(tipoPlantio, row) {
  const rowNum = Number(row);
  if (isNaN(rowNum)) {
    // Se não for número válido, padrão crescente
    return "CRESCENTE";
  }

  switch (tipoPlantio) {
    case "4 LINHAS":
      // ROW ímpar = CRESCENTE, ROW par = DECRESCENTE
      return rowNum % 2 === 1 ? "CRESCENTE" : "DECRESCENTE";
    case "8 LINHAS": {
      // Grupos de 2 linhas: 1-2 CRESC, 3-4 DESC, 5-6 CRESC, 7-8 DESC, ...
      const groupIndex = Math.floor((rowNum - 1) / 2);
      return groupIndex % 2 === 0 ? "CRESCENTE" : "DECRESCENTE";
    }
    case "PLANTIO MANUAL":
    default:
      // Sempre crescente para plantio manual ou tipos desconhecidos
      return "CRESCENTE";
  }
}

/**
 * Normaliza valor para comparação (igual ao usado em todo o sistema)
 * @param {*} value
 * @returns {string}
 */
export function normalizeValue(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

/**
 * Identifica inteligentemente a coluna correspondente a um tipo de dado
 * @param {string[]} headers - Array de cabeçalhos da planilha
 * @param {string[]} possibleNames - Nomes possíveis (ex: ["id", "codigo", "material"])
 * @returns {string|null} - O cabeçalho encontrado ou null
 */
export function findColumn(headers, possibleNames) {
  if (!headers || headers.length === 0) return null;

  // Primeiro tenta match exato normalizado
  for (const header of headers) {
    const norm = normalizeValue(header);
    for (const name of possibleNames) {
      if (norm === normalizeValue(name)) {
        return header;
      }
    }
  }

  // Depois tenta match parcial (contém)
  for (const header of headers) {
    const norm = normalizeValue(header);
    for (const name of possibleNames) {
      if (norm.includes(normalizeValue(name))) {
        return header;
      }
    }
  }

  return null;
}

/**
 * Ordena registros preservando a relação ID-RANGE-ROW-QUADRA
 * @param {Array<Object>} records - Array de objetos (linhas da planilha)
 * @param {string} idColumn - Nome da coluna de ID
 * @param {string} rangeColumn - Nome da coluna de RANGE
 * @param {string} direction - "CRESCENTE" ou "DECRESCENTE"
 * @returns {Array<Object>} - Array ordenado
 */
export function sortRecordsByIdRange(records, idColumn, rangeColumn, direction) {
  if (!records || records.length === 0) return [];

  return [...records].sort((a, b) => {
    const idA = a[idColumn];
    const idB = b[idColumn];
    const rangeA = a[rangeColumn];
    const rangeB = b[rangeColumn];

    // Tenta converter para número se possível
    const numIdA = !isNaN(idA) ? Number(idA) : idA;
    const numIdB = !isNaN(idB) ? Number(idB) : idB;
    const numRangeA = !isNaN(rangeA) ? Number(rangeA) : rangeA;
    const numRangeB = !isNaN(rangeB) ? Number(rangeB) : rangeB;

    let comparison = 0;
    if (numIdA !== numIdB) {
      comparison =
        typeof numIdA === "number" && typeof numIdB === "number"
          ? numIdA - numIdB
          : String(numIdA).localeCompare(String(numIdB));
    } else {
      // IDs iguais, ordena por RANGE
      comparison =
        typeof numRangeA === "number" && typeof numRangeB === "number"
          ? numRangeA - numRangeB
          : String(numRangeA).localeCompare(String(numRangeB));
    }

    // Inverte se for decrescente
    return direction === "CRESCENTE" ? comparison : -comparison;
  });
}

/**
 * Remove registros duplicados pelo ID (mesma planilha repetida em várias abas
 * ou linhas duplicadas), mantendo exatamente UMA ocorrência de cada ID.
 * Preserva a ordem original de primeira aparição. Quando o ID aparece mais
 * de uma vez, prefere o registro cujo RANGE não está vazio.
 * @param {Array<Object>} records - Registros filtrados da planilha
 * @param {string} idColumn - Nome da coluna de ID
 * @param {string} rangeColumn - Nome da coluna de RANGE
 * @returns {Array<Object>} - Array sem duplicatas por ID
 */
export function dedupeById(records, idColumn, rangeColumn) {
  if (!Array.isArray(records) || records.length === 0) return [];
  const buckets = new Map();
  for (const record of records) {
    const key = normalizeValue(record?.[idColumn]);
    if (!key) continue;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(record);
  }
  const result = [];
  for (const bucket of buckets.values()) {
    const preferred =
      bucket.find((r) => r[rangeColumn] !== "" && r[rangeColumn] !== null && r[rangeColumn] !== undefined) ||
      bucket[0];
    result.push(preferred);
  }
  return result;
}

/**
 * Aplica múltiplos filtros aos registros
 * @param {Array<Object>} records - Registros a filtrar
 * @param {Object} filters - Objeto com chaves = nomes de colunas, valores = valores filtrados
 * @param {Object} columnMap - Mapeamento de nomes lógicos para nomes reais das colunas
 * @returns {Array<Object>} - Registros filtrados
 */
export function applyFilters(records, filters, columnMap) {
  if (!records || records.length === 0) return [];
  if (!filters || Object.keys(filters).length === 0) return records;

  return records.filter((record) => {
    for (const [filterKey, filterValue] of Object.entries(filters)) {
      // Ignora filtros vazios ou "TODOS"
      if (
        filterValue === "" ||
        filterValue === null ||
        filterValue === undefined ||
        (typeof filterValue === "string" && filterValue.toUpperCase() === "TODOS")
      ) {
        continue;
      }

      const columnName = columnMap[filterKey];
      if (!columnName) continue;

      const recordValue = record[columnName];
      if (recordValue === null || recordValue === undefined) return false;

      // Todas as comparações são obrigatórias (AND):
      // não retorna verdadeiro na primeira — só retorna falso se alguma falhar.
      if (normalizeValue(recordValue) !== normalizeValue(filterValue)) return false;
    }
    return true;
  });
}

/**
 * Calcula a posição esperada na sequência filtrada
 * @param {Array<Object>} sequence - Sequência já filtrada e ordenada
 * @param {string} bipedId - ID que foi bipado
 * @param {string} idColumn - Nome da coluna de ID
 * @returns {number} - Índice na sequência (0-based) ou -1 se não encontrado
 */
export function findPositionInSequence(sequence, bipedId, idColumn) {
  if (!sequence || sequence.length === 0) return -1;

  const normBipedId = normalizeValue(bipedId);
  for (let i = 0; i < sequence.length; i++) {
    if (normalizeValue(sequence[i][idColumn]) === normBipedId) {
      return i;
    }
  }
  return -1;
}

/**
 * Calcula a próxima posição após erro (volta 5 casas)
 * @param {number} currentPosition - Posição atual (0-based)
 * @param {number} sequenceLength - Comprimento total da sequência
 * @returns {number} - Nova posição (0-based)
 */
export function calculateRollbackPosition(currentPosition, sequenceLength) {
  const newPosition = Math.max(0, currentPosition - 5);
  return Math.min(newPosition, sequenceLength - 1);
}

/**
 * Determina o status do bipagem baseado na comparação
 * @param {Object} expected - Registro esperado
 * @param {Object} actual - Registro realmente bipado (do mesmo ID)
 * @param {string} idColumn - Nome da coluna de ID
 * @param {string} rangeColumn - Nome da coluna de RANGE
 * @param {string} direction - Direção esperada da sequência atual
 * @returns {{status: string, message: string, details: Object}} - Resultado da comparação
 */
export function evaluateBip(expected, actual, idColumn, rangeColumn, direction) {
  if (!expected) {
    return {
      status: "NOT_FOUND",
      message: "MATERIAL NÃO PERTENCE À CONFERÊNCIA ATUAL",
      details: {}
    };
  }

  const expectedId = expected[idColumn];
  const actualId = actual[idColumn];
  const expectedRange = expected[rangeColumn];
  const actualRange = actual[rangeColumn];

  // Mesmo ID e mesmo RANGE = correto
  if (
    normalizeValue(expectedId) === normalizeValue(actualId) &&
    normalizeValue(expectedRange) === normalizeValue(actualRange)
  ) {
    return {
      status: "CORRECT",
      message: "✓ CONFERIDO",
      details: { expected, actual }
    };
  }

  // Se chegar aqui, está errado
  return {
    status: "ERROR",
    message: "⚠ ERRO - MATERIAL FORA DA ORDEM",
    details: { expected, actual }
  };
}