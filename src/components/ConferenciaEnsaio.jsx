import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Icon from "./ui/Icon.jsx";
import { getConferenciaDirection, normalizeValue, findColumn, sortRecordsByIdRange, applyFilters, findPositionInSequence, calculateRollbackPosition, evaluateBip } from "../utils/conferenciaUtils.js";
import * as conferenciaService from "../services/conferenciaService.js";
import { guessIdColumn } from "../utils/validation.js";

const CONFERENCIA_FILTROS = [
  { key: "local", label: "Local", options: [] }, // será preenchido dinamicamente da planilha
  { key: "tipoPlantio", label: "Tipo de Plantio", options: ["8 LINHAS", "4 LINHAS", "PLANTIO MANUAL"] }, // fixo: apenas estas 3 opções
  { key: "plantador", label: "Plantador", options: ["TODOS"] }, // A/B vêm da planilha (coluna plantador/planter/responsável)
  { key: "quadra", label: "Quadra", options: [] }, // será preenchido dinamicamente
  { key: "row", label: "ROW", options: ["TODOS"] } // será preenchido dinamicamente
];

export default function ConferenciaEnsaio({ rows = [], headers = [], idColumn = "", displayColumns = [] }) {
  // ---------- Estado de filtros ----------
  const [filtros, setFiltros] = useState({
    local: "",
    tipoPlantio: "",
    plantador: "TODOS",
    quadra: "",
    row: "TODOS"
  });

  // ---------- Estado de mapeamento de colunas (auto + overrides) ----------
  const [columnMap, setColumnMap] = useState({});
  const [columnError, setColumnError] = useState(null); // { missing: string[], message: string }

  // ---------- Estado de conferência ----------
  const [sequence, setSequence] = useState([]); // registros filtrados + ordenados
  const [position, setPosition] = useState(0); // índice na sequence
  const [feedback, setFeedback] = useState(null); // {status, message, details}
  const [history, setHistory] = useState(conferenciaService.loadConferencia()); // array de objetos
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef(null);
  const [lastBip, setLastBip] = useState("");

  // ---------- Valores dinâmicos para filtros ----------
  const uniqueValues = useMemo(() => {
    if (!rows || rows.length === 0) return {};
    const map = {};
    // Usa o mapeamento manual primeiro; senão tenta detecção automática.
    const colFor = (key, candidates) => columnMap[key] || findColumn(headers, candidates);
    const distinctVals = (col) => [
      ...new Set(rows.map(r => r[col]).filter(v => v !== "" && v !== null && v !== undefined))
    ];
    // local
    const localCol = colFor("local", ["local", "localidade"]);
    if (localCol) {
      map.local = distinctVals(localCol).sort();
    }
    // plantador: puxa A/B (ou os nomes reais) direto da planilha
    const plantadorCol = colFor("plantador", [
      "plantador", "planter", "responsavel", "responsável", "operador", "colaborador", "produtor"
    ]);
    if (plantadorCol) {
      // TODOS + A/B (ou nomes) da planilha:
      // clicando em "A" o beep fica só nas linhas A; em "B", só nas B; em "TODOS", todas.
      map.plantador = ["TODOS", ...distinctVals(plantadorCol).sort()];
    }
    // quadra
    const quadraCol = colFor("quadra", ["quadra", "bloco"]);
    if (quadraCol) {
      map.quadra = distinctVals(quadraCol).sort();
    }
    // row: TODAS as linhas da planilha (valores numéricos OU texto), para permitir
    // bipar uma linha separada ou refazer a conferência sem trocar de planilha.
    const rowCol = colFor("row", ["row", "linha"]);
    if (rowCol) {
      const rawVals = [...new Set(rows.map(r => r[rowCol]).filter(v => v !== "" && v !== null && v !== undefined))];
      const strVals = [...new Set(rawVals.map(v => String(v)))];
      strVals.sort((a, b) => {
        const aNum = Number(a);
        const bNum = Number(b);
        if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
        return a.localeCompare(b);
      });
      map.row = ["TODOS", ...strVals];
    }
    return map;
  }, [rows, headers, columnMap]);

  // ---------- Auto-detect column map ----------
  useEffect(() => {
    if (!rows || rows.length === 0) {
      setColumnMap({});
      setColumnError({ missing: ["ID", "ROW", "RANGE"], message: "Nenhuma planilha carregada." });
      return;
    }
    const detect = {};
    // ID
    detect.id = findColumn(headers, ["id", "codigo", "codigo material", "cod material", "material", "sku", "qr code", "qrcode", "id"]) || idColumn;
    // ROW
    detect.row = findColumn(headers, ["row", "linha"]);
    // RANGE
    detect.range = findColumn(headers, ["range", "faixa"]);
    // PLANTADOR (A/B ou nome) — detecção ampliada para puxar da planilha
    detect.plantador = findColumn(headers, [
      "plantador", "planter", "responsavel", "responsável", "operador", "colaborador", "produtor"
    ]);
    // QUADRA
    detect.quadra = findColumn(headers, ["quadra", "bloco"]);
    // LOCAL
    detect.local = findColumn(headers, ["local", "localidade"]);
    // TIPO DE PLANTIO
    detect.tipoPlantio = findColumn(headers, ["tipo de plantio", "tipo plantio", "tipo"]);
    // SENTIDO
    detect.sentido = findColumn(headers, ["sentido", "direcao", "direção"]);
    // ORDEM DE BEEP
    detect.ordemBeep = findColumn(headers, ["ordem de beep", "beep order", "sequencia"]);
    // ENTRY / PREFIXO / SUFIXO / REP / BOOK NAME (colunas exibidas na tabela)
    detect.entry = findColumn(headers, ["entry", "entrada"]);
    detect.entryPrefix = findColumn(headers, ["entry prefix", "prefix entry", "prefixo entry", "prefixo"]);
    detect.entrySuffix = findColumn(headers, ["entry suffix", "suffix entry", "sufixo entry", "sufixo"]);
    detect.rep = findColumn(headers, ["rep", "repeticao", "repetição"]);
    detect.bookName = findColumn(headers, ["book name", "nome do livro", "livro", "book"]);

    setColumnMap(detect);
    // checar obrigatórias
    const missing = [];
    if (!detect.id) missing.push("ID");
    if (!detect.row) missing.push("ROW");
    if (!detect.range) missing.push("RANGE");
    // todas as colunas lógicas ainda não mapeadas (inclui opcionais) aparecem no aviso
    const logicalKeys = ["id", "row", "range", "plantador", "quadra", "local", "tipoPlantio", "sentido", "ordemBeep", "entry", "entryPrefix", "entrySuffix", "rep", "bookName"];
    const unmapped = logicalKeys.filter(k => !detect[k]).map(k => k.toUpperCase()).filter(k => !missing.includes(k));
    if (missing.length > 0) {
      setColumnError({ missing: [...missing, ...unmapped], message: `Colunas obrigatórias não encontradas: ${missing.join(", ")}. Mapeie manualmente abaixo.` });
    } else {
      setColumnError(null);
    }
  }, [rows, headers, idColumn]);

  // ---------- Construir sequência (memoizada) ----------
  const processedSequence = useMemo(() => {
    // Se faltam filtros obrigatórios ou mapeamento, vazio
    if (!filtros.tipoPlantio) return [];
    const requiredCols = ["id", "row", "range"];
    const missingReq = requiredCols.filter(col => !columnMap[col]);
    if (missingReq.length > 0) return [];

    // Filtragem base
    let filtered = rows;
    // aplica filtros de UI (local, tipoPlantio, plantador, quadra, row)
    const uiFilters = {};
    if (filtros.local) uiFilters.local = filtros.local;
    if (filtros.plantador) uiFilters.plantador = filtros.plantador;
    if (filtros.quadra) uiFilters.quadra = filtros.quadra;
    // tipoPlantio e row são tratadas separadamente (para ordenação)
    if (filtros.tipoPlantio) uiFilters.tipoPlantio = filtros.tipoPlantio;
    if (filtros.row && filtros.row !== "TODOS") uiFilters.row = filtros.row;

    const columnMapForFilters = {
      local: columnMap.local,
      plantador: columnMap.plantador,
      quadra: columnMap.quadra,
      tipoPlantio: columnMap.tipoPlantio,
      row: columnMap.row
    };

    filtered = applyFilters(filtered, uiFilters, columnMapForFilters);

    // Se ainda vazio
    if (filtered.length === 0) return [];

    // Agrupa por ROW (valor da coluna row)
    const rowCol = columnMap.row;
    const groups = {};
    filtered.forEach(record => {
      const rowVal = record[rowCol];
      if (rowVal === null || rowVal === undefined) return;
      const key = String(rowVal);
      if (!groups[key]) groups[key] = [];
      groups[key].push(record);
    });

    // Ordena grupos por ROW numérico (se possível)
    const rowKeys = Object.keys(groups).sort((a,b) => {
      const aNum = Number(a);
      const bNum = Number(b);
      if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
      return a.localeCompare(b);
    });

    // Ordena dentro de cada grupo
    const sequence = [];
    for (const rowKey of rowKeys) {
      const groupRecords = groups[rowKey];
      // Direção depende do tipoPlantio e ROW (numérica)
      const rowNum = Number(rowKey);
      const direction = getConferenciaDirection(filtros.tipoPlantio, rowNum);
      const sorted = sortRecordsByIdRange(groupRecords, columnMap.id, columnMap.range, direction);
      sequence.push(...sorted);
    }
    return sequence;
  }, [rows, filtros, columnMap, columnMap.id, columnMap.range, columnMap.row, columnMap.local, columnMap.plantador, columnMap.quadra, columnMap.tipoPlantio]);

  // ---------- Trava a posição quando a sequência muda ----------
  // Ao trocar filtros/linha (inclusive após terminar ou limpar), se a nova sequência
  // for mais curta, a posição é ajustada — evita ficar preso na tela "Finalizada"
  // e bloqueando a próxima conferência.
  useEffect(() => {
    setPosition(prev => (prev > processedSequence.length ? processedSequence.length : prev));
  }, [processedSequence.length]);

  // ---------- Ao trocar qualquer filtro, reinicia a conferência do zero ----------
  // Evita travamento/confusão: selecionou Plantador A → só as linhas A, do início;
  // selecionou Plantador B → só as linhas B, do início.
  useEffect(() => {
    setPosition(0);
    setFeedback(null);
    setLastBip("");
  }, [filtros]);

  // ---------- Próximo esperado ----------
  const nextExpected = useMemo(() => {
    if (position >= processedSequence.length) return null;
    return processedSequence[position];
  }, [processedSequence, position]);

  // ---------- Histórico estatísticas ----------
  const stats = useMemo(() => {
    const confirmed = history.filter(h => h.status === "CONFERIDO").length;
    const errors = history.filter(h => h.status === "ERRO").length;
    const reconfirmations = history.filter(h => h.status === "RECONFERÊNCIA").length;
    const total = processedSequence.length;
    const remaining = Math.max(0, total - (confirmed + errors + reconfirmations));
    return { confirmed, errors, reconfirmations, total, remaining };
  }, [history, processedSequence.length]);

  // ---------- Funções de ação ----------
  const handleBip = useCallback((value) => {
    if (isLoading) return;
    if (!inputRef.current) return;
    const biped = String(value ?? "").trim();
    if (biped === "") return;
    setLastBip(biped);

    // Se não há sequência (filtros não prontos)
    if (processedSequence.length === 0) {
      setFeedback({
        status: "WARN",
        message: "Configure os filtros e carregue uma planilha válida para iniciar.",
        details: {}
      });
      setLastBip("");
      setTimeout(() => inputRef.current?.focus(), 0);
      return;
    }

    // Procura o ID na sequência inteira (para verificar existência)
    const positionInSeq = findPositionInSequence(processedSequence, biped, columnMap.id);
    const existsInSeq = positionInSeq !== -1;

    if (!existsInSeq) {
      // ID não pertence aos filtros atuais
      const expected = nextExpected;
      const bipedRecord = rows.find(r => normalizeValue(r[columnMap.id]) === normalizeValue(biped));
      setFeedback({
        status: "ERROR",
        message: "⚠ MATERIAL NÃO PERTENCE À CONFERÊNCIA ATUAL",
        details: {
          expected,
          biped: bipedRecord || { [columnMap.id]: biped }
        }
      });
      conferenciaService.playErrorBeep();
      conferenciaService.vibrateError();
      // grava erro no histórico
      const historyRecord = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        local: filtros.local || "",
        tipoPlantio: filtros.tipoPlantio || "",
        plantador: filtros.plantador || "",
        quadra: filtros.quadra || "",
        row: filtros.row === "TODOS" ? "" : filtros.row,
        esperadoId: expected ? expected[columnMap.id] : null,
        esperadoRange: expected ? expected[columnMap.range] : null,
        bipadoId: biped,
        bipadoRange: bipedRecord ? bipedRecord[columnMap.range] : null,
        status: "ERRO",
        posicao: position,
        usuario: "" // poderia pegar de algum storage de usuário
      };
      setHistory(prev => {
        const updated = [historyRecord, ...prev];
        conferenciaService.saveConferencia(updated);
        return updated;
      });
      setLastBip("");
      setTimeout(() => inputRef.current?.focus(), 0);
      return;
    }

    // ID existe na sequência
    const expected = nextExpected;
    if (!expected) {
      // já terminou?
      setFeedback({
        status: "INFO",
        message: "Conferência já finalizada!",
        details: {}
      });
      setLastBip("");
      setTimeout(() => inputRef.current?.focus(), 0);
      return;
    }

    const actualRecord = processedSequence.find(r => normalizeValue(r[columnMap.id]) === normalizeValue(biped));
    const evalResult = evaluateBip(expected, actualRecord || {}, columnMap.id, columnMap.range, filtros.tipoPlantio);

    // Registra no histórico sempre
    const historyRecord = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      local: filtros.local || "",
      tipoPlantio: filtros.tipoPlantio || "",
      plantador: filtros.plantador || "",
      quadra: filtros.quadra || "",
      row: filtros.row === "TODOS" ? "" : filtros.row,
      esperadoId: expected[columnMap.id],
      esperadoRange: expected[columnMap.range],
      bipadoId: biped,
      bipadoRange: actualRecord ? actualRecord[columnMap.range] : null,
      status: evalResult.status === "CORRECT" ? "CONFERIDO" :
               evalResult.status === "ERROR" ? "ERRO" : "RECONFERÊNCIA",
      posicao: position,
      usuario: ""
    };
    const newHistory = [historyRecord, ...history];
    setHistory(newHistory);
    conferenciaService.saveConferencia(newHistory);

    // Atualiza feedback e position
    if (evalResult.status === "CORRECT") {
      // Avança para o próximo
      setPosition(prev => Math.min(prev + 1, processedSequence.length));
      setFeedback({
        status: "SUCCESS",
        message: evalResult.message,
        details: evalResult.details
      });
      conferenciaService.playSuccessBeep();
      conferenciaService.vibrateSuccess();
    } else {
      // ERRO: volta 5 posições
      const newPos = calculateRollbackPosition(position, processedSequence.length);
      setPosition(newPos);
      setFeedback({
        status: "ERROR",
        message: evalResult.message,
        details: evalResult.details
      });
      conferenciaService.playErrorBeep();
      conferenciaService.vibrateError();
    }

    // limpa input e foca para o próximo bip
    setLastBip("");
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [processedSequence, position, filtros, columnMap, history, nextExpected, isLoading]);

  // ---------- Reset conferência ----------
  const resetConferencia = useCallback(() => {
    if (!window.confirm("Deseja realmente reiniciar esta conferência? Todos os progressos serão perdidos.")) return;
    setPosition(0);
    setFeedback(null);
    setLastBip("");
    // volta aos filtros: começa uma nova conferência do zero
    setFiltros({ local: "", tipoPlantio: "", plantador: "TODOS", quadra: "", row: "TODOS" });
    // limpa histórico de conferência (mantém o carregado da storage? spec diz só resetar posição)
    // Porém histórico é separado do histórico de estoque. Mantemos o array em memória, limpo storage.
    setHistory([]);
    conferenciaService.clearConferencia();
    inputRef.current?.focus();
  }, []);

  // ---------- UI de mapeamento de colunas (se faltando) ----------
  const renderColumnMapping = () => {
    if (!columnError) return null;
    const { missing } = columnError;
    const mappingControls = Object.keys(columnMap).filter(key => missing.includes(key.toUpperCase())).map(key => {
      const labelMap = {
        id: "ID",
        row: "ROW",
        range: "RANGE",
        local: "LOCAL",
        plantador: "PLANTADOR",
        quadra: "QUADRA",
        tipoPlantio: "TIPO DE PLANTIO",
        sentido: "SENTIDO",
        ordemBeep: "ORDEM DE BEEP",
        entry: "ENTRY",
        entryPrefix: "ENTRY PREFIX",
        entrySuffix: "ENTRY SUFFIX",
        rep: "REP",
        bookName: "BOOK NAME"
      };
      const options = headers || [];
      return (
        <div key={key} style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{labelMap[key]}</label>
          <select
            value={columnMap[key] || ""}
            onChange={(e) => {
              const val = e.target.value;
              setColumnMap(prev => ({ ...prev, [key]: val }));
            }}
            style={{ width: "100%", padding: "8px", borderRadius: 6 }}
          >
            <option value="">-- selecione a coluna --</option>
            {options.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      );
    });
    return (
      <div style={{ background: "#fffbeb", border: "1px solid #fbd38d", borderRadius: 10, padding: 16, margin: "0 22px 20px 22px" }}>
        <h3 style={{ marginTop: 0, color: "#92400e" }}>⚠ Mapeamento de Colunas Necessário</h3>
        <p style={{ margin: "8px 0 16px 0", lineHeight: 1.5 }}>{columnError.message}</p>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
          {mappingControls}
        </div>
        <div style={{ marginTop: 16, textAlign: "right" }}>
          <button onClick={() => setColumnError(null)} style={{ padding: "8px 16px", background: "var(--surface-soft)", border: "1px solid var(--border)", borderRadius: 6, cursor: "pointer" }}>
            Fechar (usar detecção automática)
          </button>
        </div>
      </div>
    );
  };

  // ---------- Foco automático no input após render ----------
  useEffect(() => {
    if (inputRef.current && !inputRef.current.disabled) {
      inputRef.current.focus();
    }
  }, [position, feedback, processedSequence.length]); // refoca após bip ou avanço ou mudança de sequência

  // ---------- Render ----------
  return (
    <div className="conf-shell">
      {/* Cabeçalho */}
      <div className="conf-card">
        <div className="conf-card-header">
          <div className="conf-step-badge">1</div>
          <div>
            <h2>Conferência de Ensaio</h2>
            <p>Confira a montagem de ensaios agrícolas por bipagem de materiais</p>
          </div>
        </div>

        {/* Mensagem de erro de coluna (se houver) */}
        {renderColumnMapping()}

        {/* Filtros */}
        <div className="conf-filters">
          {CONFERENCIA_FILTROS.map(({ key, label, options: staticOptions }) => {
            // Filtros dinâmicos (local, plantador, quadra, row) recebem options via uniqueValues
            const isDynamic = key === "local" || key === "plantador" || key === "quadra" || key === "row";
            const dynamicOptions =
              uniqueValues[key] && Array.isArray(uniqueValues[key]) ? uniqueValues[key] : [];
            // ROW: TODAS as linhas da planilha (+ TODOS). Tipo de Plantio: fixo (só as 3 opções).
            const opts = isDynamic && dynamicOptions.length ? dynamicOptions : staticOptions;
            const isTipoPlantio = key === "tipoPlantio";
            return (
              <div key={key} className="conf-filter-item">
                <label>{label}</label>
                <select
                  value={filtros[key] || ""}
                  onChange={(e) => setFiltros(prev => ({ ...prev, [key]: e.target.value }))}
                  disabled={!rows.length}
                  style={{ minWidth: 0 }}
                >
                  {(isTipoPlantio || !opts.length) && <option value="" disabled hidden>-- Selecione --</option>}
                  {opts.map(opt => (
                    <option key={`${key}-${opt}`} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>

        {/* Status da conferência */}
        <div className="conf-status-grid">
          <div className="conf-status-card">
            <h3>PRÓXIMO ESPERADO</h3>
            {nextExpected ? (
              <>
                <div className="conf-status-value">
                  ID: {nextExpected[columnMap.id ?? ""]}
                </div>
                <div className="conf-status-value" style={{ marginTop: 4 }}>
                  RANGE: {nextExpected[columnMap.range ?? ""]}
                </div>
                <div className="conf-status-value" style={{ marginTop: 4 }}>
                  ROW: {nextExpected[columnMap.row ?? ""]}
                </div>
                {columnMap.quadra && (
                  <div className="conf-status-value" style={{ marginTop: 4 }}>
                    QUADRA: {nextExpected[columnMap.quadra] ?? "-"}
                  </div>
                )}
                {columnMap.entry && (
                  <div className="conf-status-value" style={{ marginTop: 4 }}>
                    ENTRY: {nextExpected[columnMap.entry] ?? "-"}
                  </div>
                )}
                {columnMap.entryPrefix && (
                  <div className="conf-status-value" style={{ marginTop: 4 }}>
                    ENTRY PREFIX: {nextExpected[columnMap.entryPrefix] ?? "-"}
                  </div>
                )}
                {columnMap.entrySuffix && (
                  <div className="conf-status-value" style={{ marginTop: 4 }}>
                    ENTRY SUFFIX: {nextExpected[columnMap.entrySuffix] ?? "-"}
                  </div>
                )}
                {columnMap.rep && (
                  <div className="conf-status-value" style={{ marginTop: 4 }}>
                    REP: {nextExpected[columnMap.rep] ?? "-"}
                  </div>
                )}
                {columnMap.bookName && (
                  <div className="conf-status-value" style={{ marginTop: 4 }}>
                    BOOK NAME: {nextExpected[columnMap.bookName] ?? "-"}
                  </div>
                )}
                {columnMap.sentido && (
                  <div className="conf-status-value" style={{ marginTop: 4 }}>
                    SENTIDO: {nextExpected[columnMap.sentido] || "-"}
                  </div>
                )}
              </>
            ) : (
              <div className="conf-status-value" style={{ color: "#9ca3af" }}>—</div>
            )}
          </div>
          <div className="conf-status-card">
            <h3>STATUS DA CONFERÊNCIA</h3>
            {feedback ? (
              <div className={`conf-feedback conf-feedback-${feedback.status.toLowerCase()}`}>
                <div className="conf-feedback-title">{feedback.message}</div>
                {feedback.details.expected && feedback.details.biped && (
                  <div className="conf-feedback-details">
                    <div><strong>ESPERADO:</strong> ID {feedback.details.expected[columnMap.id ?? ""]} / RANGE {feedback.details.expected[columnMap.range ?? ""]}</div>
                    <div><strong>BIPADO:</strong> ID {feedback.details.biped[columnMap.id ?? ""] || feedback.details.biped.id} / RANGE {feedback.details.biped[columnMap.range ?? ""] || feedback.details.biped.range}</div>
                  </div>
                )}
              </div>
            ) : (
              <div className="conf-feedback conf-feedback-info">
                <div className="conf-feedback-title">AGUARDANDO BIPAGEM</div>
                <div className="conf-feedback-details">Posicione o cursor no campo abaixo e bipar o material</div>
              </div>
            )}
          </div>
        </div>

        {/* Área de input */}
        <div className="conf-input-area">
          <label>BIPAR MATERIAL (ID)</label>
          <input
            ref={inputRef}
            placeholder="Digite ou bipar o código do material"
            value={lastBip}
            onChange={(e) => setLastBip(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleBip(lastBip);
              }
            }}
            disabled={processedSequence.length === 0 || !inputRef.current}
          />
        </div>

        {/* Barra de ações */}
        <div className="conf-action-bar">
          <button
            className="conf-btn conf-btn-primary"
            onClick={() => {
              if (lastBip && lastBip.trim()) handleBip(lastBip);
            }}
            disabled={processedSequence.length === 0 || !lastBip.trim() || isLoading}
          >
            <Icon name="check" size={16} /> CONFIRMAR
          </button>
          <button
            className="conf-btn"
            onClick={resetConferencia}
            disabled={history.length === 0 && processedSequence.length === 0}
          >
            <Icon name="alert" size={16} /> ↻ Reiniciar Conferência
          </button>
          {!isLoading && history.length > 0 && (
            <button
              className="conf-btn"
              onClick={() => {
                if (window.confirm("Limpar todo o histórico desta conferência?")) {
                  setHistory([]);
                  setPosition(0);
                  setFeedback(null);
                  conferenciaService.clearConferencia();
                }
              }}
            >
              <Icon name="trash" size={16} /> Limpar Histórico
            </button>
          )}
        </div>

        {/* Progresso */}
        <div className="conf-progress">
          <div className="conf-progress-header">
            <span>PROGRESSO</span>
            <strong>{Math.min(position, processedSequence.length)} / {processedSequence.length}</strong>
          </div>
          <div className="conf-progress-bar">
            <div
              className="conf-progress-fill"
              style={{ width: `${processedSequence.length > 0 ? (position / processedSequence.length) * 100 : 0}%` }}
            />
          </div>
          <div className="conf-progress-stats">
            <div className="conf-stat conf-stat-success">
              <div className="conf-stat-label">CONFERIDOS</div>
              <div className="conf-stat-value">{stats.confirmed}</div>
            </div>
            <div className="conf-stat conf-stat-error">
              <div className="conf-stat-label">ERROS</div>
              <div className="conf-stat-value">{stats.errors}</div>
            </div>
            <div className="conf-stat conf-stat-warning">
              <div className="conf-stat-label">RECONFERÊNCIAS</div>
              <div className="conf-stat-value">{stats.reconfirmations}</div>
            </div>
            <div className="conf-stat conf-stat-pending">
              <div className="conf-stat-label">RESTANTES</div>
              <div className="conf-stat-value">{stats.remaining}</div>
            </div>
          </div>
        </div>

        {/* Tabela da sequência (próximos 15) */}
        {processedSequence.length > 0 && (
          <div className="conf-table-wrapper">
            <table className="conf-table">
               <thead>
                  <tr>
                    <th>ORDEM</th>
                    <th>ID</th>
                    <th>RANGE</th>
                    <th>ROW</th>
                    {columnMap.quadra && <th>QUADRA</th>}
                    {columnMap.entry && <th>ENTRY</th>}
                    {columnMap.entryPrefix && <th>ENTRY PREFIX</th>}
                    {columnMap.entrySuffix && <th>ENTRY SUFFIX</th>}
                    {columnMap.rep && <th>REP</th>}
                    {columnMap.bookName && <th>BOOK NAME</th>}
                    {columnMap.plantador && <th>PLANTADOR</th>}
                    {columnMap.sentido && <th>SENTIDO</th>}
                    <th>STATUS</th>
                  </tr>
               </thead>
              <tbody>
                {processedSequence.slice(Math.max(0, position - 2), position + 13).map((record, idx) => {
                  const globalIdx = Math.max(0, position - 2) + idx;
                  const isCurrent = globalIdx === position;
                  const isDone = globalIdx < position;
                  const status =
                    isDone ? "CONFERIDO" :
                    isCurrent ? "AGUARDANDO" :
                    "PENDENTE";
                  return (
                    <tr
                      key={`${record[columnMap.id]}-${globalIdx}`}
                      className={`conf-row-${isCurrent ? "current" : isDone ? "done" : ""}`}
                    >
                      <td>{globalIdx + 1}</td>
                      <td>{record[columnMap.id ?? ""]}</td>
                      <td>{record[columnMap.range ?? ""]}</td>
                      <td>{record[columnMap.row ?? ""]}</td>
                      {columnMap.quadra && (
                        <td>{record[columnMap.quadra ?? ""] || "-"}</td>
                      )}
                      {columnMap.entry && (
                        <td>{record[columnMap.entry ?? ""] || "-"}</td>
                      )}
                      {columnMap.entryPrefix && (
                        <td>{record[columnMap.entryPrefix ?? ""] || "-"}</td>
                      )}
                      {columnMap.entrySuffix && (
                        <td>{record[columnMap.entrySuffix ?? ""] || "-"}</td>
                      )}
                      {columnMap.rep && (
                        <td>{record[columnMap.rep ?? ""] || "-"}</td>
                      )}
                      {columnMap.bookName && (
                        <td>{record[columnMap.bookName ?? ""] || "-"}</td>
                      )}
                      {columnMap.plantador && (
                        <td>{record[columnMap.plantador ?? ""] || "-"}</td>
                      )}
                      {columnMap.sentido && (
  <td>{record[columnMap.sentido ?? ""] || "-"}</td>
)}
                      <td>
                        <span className={`conf-status-badge conf-status-badge-${status.toLowerCase() === "conferido" ? "done" : status.toLowerCase() === "aguardando" ? "waiting" : status.toLowerCase() === "pendente" ? "pending" : "error"}`}>
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Mensagem vazia */}
        {processedSequence.length === 0 && rows.length > 0 && (
          <div className="conf-empty">
            Nenhum material corresponde aos filtros selecionados.
          </div>
        )}

        {/* Tela final */}
        {position >= processedSequence.length && processedSequence.length > 0 && (
          <div className="conf-final-screen">
            <div className="conf-final-icon">
              <Icon name="check" size={48} />
            </div>
            <h2>✓ CONFERÊNCIA FINALIZADA</h2>
            <p>Todos os materiais foram conferidos corretamente.</p>
            <div className="conf-final-stats">
              <div className="conf-final-stat">
                <div className="conf-stat-value">{processedSequence.length}</div>
                <div>TOTAL</div>
              </div>
              <div className="conf-final-stat">
                <div className="conf-stat-value" style={{ color: "var(--accent)" }}>{stats.confirmed}</div>
                <div>CONFERIDOS</div>
              </div>
              <div className="conf-final-stat">
                <div className="conf-stat-value" style={{ color: "var(--danger)" }}>{stats.errors}</div>
                <div>ERROS</div>
              </div>
              <div className="conf-final-stat">
                <div className="conf-stat-value" style={{ color: "#fbbf24" }}>{stats.reconfirmations}</div>
                <div>RECONFERÊNCIAS</div>
              </div>
            </div>
            <button
              className="conf-btn conf-btn-primary"
              onClick={resetConferencia}
              style={{ marginTop: 24 }}
            >
              <Icon name="arrow-clockwise" size={16} /> Iniciar Nova Conferência
            </button>
          </div>
        )}
      </div>
    </div>
  );
}