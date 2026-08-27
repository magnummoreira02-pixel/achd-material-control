// ACHD Material Control - Complete Modular Implementation
// Updated with modern dark mode design and full functionality preservation

import React, { useState, useMemo, useRef, useCallback, useEffect } from "react";

// Import all components
import Header from './components/Header.jsx';
import Dashboard from './components/Dashboard.jsx';
import ImportadorPlanilha from './components/ImportadorPlanilha.jsx';
import ConfiguradorColunas from './components/ConfiguradorColunas.jsx';
import BuscaMaterial from './components/BuscaMaterial.jsx';
import Historico from './components/Historico.jsx';
import Movimentacoes from './components/Movimentacoes.jsx';
import ControleCaixas from './components/ControleCaixas.jsx';
import ConsultaEstoque from './components/ConsultaEstoque.jsx';
import QRScanner from './components/QRScanner.jsx';
import DeleteBoxModal from './components/DeleteBoxModal.jsx';
import Backup from './components/Backup.jsx';
import ConferenciaEnsaio from './components/ConferenciaEnsaio.jsx';
import Icon from './components/ui/Icon.jsx';
import "./styles/conferencia.css";

// Import services
import * as storageService from './services/storageService.js';
import * as excelService from './services/excelService.js';
import * as backupService from './services/backupService.js';
import * as printService from './services/printService.js';

// Import utils
import * as utils from './utils/validation.js';
import * as formatting from './utils/formatting.js';
import * as constants from './utils/constants.js';

// Extract functions for use
const {
  guessIdColumn,
  normalizeValue,
  getAvancoStatus,
  getManualHighlightColor,
  getRowColor,
  getCodeColorRule,
  getOrderNumber
} = utils;

const { getExportFileName, nowDateString, nowTimeString } = formatting;

// Color constants for ACHD Material Control design
const ACHD_COLORS = {
  // Dark mode palette matching requirements
  bgDeep: '#0B0F19',
  bgSurface: '#111827',
  bgCard: '#1F2937',
  bgInput: '#0f1114',
  
  // Text colors
  textPrimary: '#E8F0EB',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  
  // Accent colors - ACHD brand colors
  accentGreen: '#22C55E',  // Green for success/active states
  accentGreenDark: '#15803D',
  accentGreenLight: '#10b981',
  accentGreenBg: 'rgba(34, 197, 94, 0.10)',
  
  accentBlue: '#60A5FA',   // Blue for active elements
  accentBlueDark: '#2563EB',
  accentBlueBg: 'rgba(96, 165, 250, 0.14)',
  
  accentPurple: '#A78BFA', // Purple for highlights
  accentPurpleBg: 'rgba(167, 139, 250, 0.14)',
  
  accentRed: '#EF4444',    // Red for warnings/alerts
  accentRedBg: 'rgba(239, 68, 68, 0.12)',
  
  accentYellow: '#EAB308', // Yellow for attention
  accentYellowBg: 'rgba(234, 179, 8, 0.12)',
  
  borderColor: '#1e293b',
  borderStrong: '#334155',
  
  // Status colors
  statusSuccess: '#10b981',
  statusWarning: '#eab308',
  statusError: '#ef4444',
  statusInfo: '#3b82f6',
};

// Typography matching requirements
const TYPOGRAPHY = {
  fontSans: "'Inter', 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  fontMono: "'IBM Plex Mono', monospace",
  fontDisplay: "'Space Grotesk', sans-serif",
  
  // Font sizes for ACHD design
  h1: '28px',      // Large heading
  h2: '24px',      // Section titles
  h3: '20px',      // Card titles
  h4: '18px',      // Component labels
  body: '16px',    // Standard text
  bodySmall: '14px',// Secondary text
  caption: '12px', // Fine print
  
  
  // Font weights
  light: 400,
  normalWeight: 500,
  medium: 600,
  semibold: 700,
  bold: 800,
  
  // Line heights
  tightLineHeight: 1.2,
  lineHeight: 1.5,
  relaxed: 1.8,
};

// Spacing system
const SPACING = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  '2xl': '32px',
  '3xl': '48px',
  '4xl': '64px',
  '5xl': '96px',
};

// Border radius for modern design
const BORDER_RADIUS = {
  none: '0',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  '2xl': '24px',
  round: '50%',
};

// Shadow system for depth
const SHADOWS = {
  none: 'none',
  sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 10px 15px -3px rgba(0, 0, 0, 0.3)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -4px rgba(0, 0, 0, 0.3)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.2)',
};

// Navigation sections (order = sidebar priority)
const MENU_ITEMS = [
  { id: "busca", label: "Seleção / Busca", icon: "search" },
  { id: "caixas", label: "Caixas de Armazenamento", icon: "box" },
  { id: "importar", label: "Importar Planilha", icon: "upload" },
  { id: "colunas", label: "Configurar Colunas", icon: "columns" },
  { id: "historico", label: "Histórico + Movimentações", icon: "history" },
  { id: "estoque", label: "Consulta de Estoque", icon: "inventory" },
  { id: "conferencia", label: "Conferência de Ensaio", icon: "check" }
];

const App = () => {
  // Navigation state
  const [activeSection, setActiveSection] = useState("busca");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // State management matching original functionality
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [sheets, setSheets] = useState([]);
  const [selectedSheets, setSelectedSheets] = useState([]);
  const [idColumn, setIdColumn] = useState("");
  const [displayColumns, setDisplayColumns] = useState([]);
  const [highlightedFields, setHighlightedFields] = useState(constants.DEFAULT_HIGHLIGHTED_FIELDS);
  const [highlightedFieldsColor, setHighlightedFieldsColor] = useState(constants.DEFAULT_HIGHLIGHT_COLOR);
  const [query, setQuery] = useState("");
  const [matched, setMatched] = useState(null);
  const [searchState, setSearchState] = useState("idle");
  const [dragOver, setDragOver] = useState(false);
  const [parseError, setParseError] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [isReadingWorkbook, setIsReadingWorkbook] = useState(false);
  const [isLoadingSheet, setIsLoadingSheet] = useState(false);
  const [availableSheets, setAvailableSheets] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [pendingFileName, setPendingFileName] = useState("");
  const [pendingBuffer, setPendingBuffer] = useState(null);
  const [theme, setTheme] = useState(() => storageService.loadTheme());
  const [history, setHistory] = useState(() => storageService.loadHistory());
  const [showFullHistory, setShowFullHistory] = useState(false);
  const [boxes, setBoxes] = useState(() => storageService.loadBoxes());
  const [movements, setMovements] = useState(() => storageService.loadMovements());
  const [activeBoxId, setActiveBoxId] = useState("");
  const [newBoxDescription, setNewBoxDescription] = useState("");
  const [newBoxNote, setNewBoxNote] = useState("");
  const [inventoryQuery, setInventoryQuery] = useState("");
  const [showInventory, setShowInventory] = useState(false);
  const [exportMessage, setExportMessage] = useState("");
  const [deleteBoxCandidate, setDeleteBoxCandidate] = useState(null);
  const backupInputRef = useRef(null);
  const [lastProcessedCode, setLastProcessedCode] = useState("");
  const [colorRules, setColorRules] = useState(constants.DEFAULT_COLOR_RULES);
  const [codeColorRules, setCodeColorRules] = useState(constants.DEFAULT_CODE_COLOR_RULES);
  const [highlightRule, setHighlightRule] = useState({ column: "", value: "", color: constants.DEFAULT_HIGHLIGHT_COLOR });
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerStatus, setScannerStatus] = useState("");
  const inputRef = useRef(null);
  const searchInputRef = useRef(null);
  const scannerVideoRef = useRef(null);
  const scannerStreamRef = useRef(null);

  // Effects for persistent storage
  useEffect(() => {
    storageService.saveBoxes(boxes);
  }, [boxes]);

  useEffect(() => {
    storageService.saveMovements(movements);
  }, [movements]);

  useEffect(() => {
    storageService.saveTheme(theme);
  }, [theme]);

  // Scanner effect - preserves original functionality
  useEffect(() => {
    if (!scannerOpen) return undefined;
    let cancelled = false;
    let animationFrame = 0;

    const stopStream = () => {
      if (scannerStreamRef.current) {
        scannerStreamRef.current.getTracks().forEach((track) => track.stop());
        scannerStreamRef.current = null;
      }
    };

    const scanFrame = async (detector) => {
      if (cancelled || !scannerVideoRef.current) return;
      try {
        const results = await detector.detect(scannerVideoRef.current);
        if (results.length > 0 && results[0].rawValue) {
          const value = results[0].rawValue;
          setScannerStatus("Leitura concluída");
          if (navigator.vibrate) navigator.vibrate(120);
          try {
            const audio = new AudioContext();
            const oscillator = audio.createOscillator();
            const gain = audio.createGain();
            oscillator.connect(gain);
            gain.connect(audio.destination);
            oscillator.frequency.value = 880;
            gain.gain.setValueAtTime(0.08, audio.currentTime);
            oscillator.start();
            oscillator.stop(audio.currentTime + 0.12);
          } catch (error) {
          }
          stopStream();
          setScannerOpen(false);
          processQRCode(value);
          return;
        }
      } catch (error) {
        setScannerStatus("Aponte a câmera para um QR Code");
      }
      animationFrame = requestAnimationFrame(() => scanFrame(detector));
    };

    const startScanner = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setScannerStatus("Câmera indisponível. Digite o código abaixo.");
        return;
      }
      if (!window.BarcodeDetector) {
        setScannerStatus("Este navegador não detecta QR automaticamente. Digite o código abaixo.");
        return;
      }
      try {
        setScannerStatus("Solicitando acesso à câmera...");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false
        });
        if (cancelled || !scannerVideoRef.current) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        scannerStreamRef.current = stream;
        scannerVideoRef.current.srcObject = stream;
        await scannerVideoRef.current.play();
        setScannerStatus("Aponte a câmera para um QR Code");
        scanFrame(new BarcodeDetector({ formats: ["qr_code"] }));
      } catch (error) {
        setScannerStatus("Não foi possível acessar a câmera. Verifique a permissão.");
      }
    };

    startScanner();
    return () => {
      cancelled = true;
      cancelAnimationFrame(animationFrame);
      stopStream();
    };
  }, [scannerOpen]);

  // Derived state calculations
  const hasData = rows.length > 0 && headers.length > 0;

  const selectedRows = useMemo(
    () => rows.filter((row) => selectedSheets.includes(row.__sheetName)),
    [rows, selectedSheets]
  );

  const readyToSearch = hasData && idColumn && selectedRows.length > 0;

  // Índice O(1) código -> linha. Reconstruído apenas quando a planilha/coluna muda,
  // para que cada busca/bipagem não percorra a planilha inteira (lenta em arquivos grandes).
  const rowIndexByCode = useMemo(() => {
    const map = new Map();
    if (!idColumn) return map;
    for (const row of selectedRows) {
      const key = normalizeValue(row[idColumn]);
      if (key && !map.has(key)) map.set(key, row);
    }
    return map;
  }, [selectedRows, idColumn]);

  useEffect(() => {
    if (readyToSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [readyToSearch]);

  const matchedRowColor = matched
    ? getRowColor(matched.__sheetName, matched, colorRules)
    : "";

  const matchedCodeColorRule = matched && idColumn
    ? getCodeColorRule(matched[idColumn], codeColorRules)
    : null;

  const matchedAvancoStatus = matched ? getAvancoStatus(matched) : "";

  const matchedAvancoColor =
    matchedAvancoStatus === "sim"
      ? colorRules.avanco.sim
      : matchedAvancoStatus === "nao"
        ? colorRules.avanco.nao
        : "";

  const matchedAvancoTextColor =
    matchedAvancoStatus === "sim" ? constants.GREEN : constants.RED;

  const matchedAvancoValue =
    matched
      ? Object.entries(matched).find(
          ([key]) => ["avanco", "avanço"].includes(normalizeValue(key))
        )?.[1]
      : "";

  // Número de Ordem: lido diretamente da linha da planilha (não calculado).
  const matchedOrderNumber = matched ? getOrderNumber(matched) : "";

  // Cor da linha inteira pelo TRAIT, reutilizando exatamente a configuração
  // existente de "Cor por prefixo de código" (codeColorRules).
  const matchedTraitValue = matched
    ? Object.entries(matched).find(([key]) => normalizeValue(key) === "trait")?.[1]
    : "";
  const matchedTraitColorRule = matched
    ? getCodeColorRule(String(matchedTraitValue ?? ""), codeColorRules)
    : null;

  const foundMaterialsCount = useMemo(
    () => history.filter((item) => item.status === "ENCONTRADO").length,
    [history]
  );

  const notFoundMaterialsCount = useMemo(
    () => history.filter((item) => item.status === "NÃO ENCONTRADO").length,
    [history]
  );

  const latestReading = history[0];

  const activeBox =
    boxes.find((box) => box.id === activeBoxId) || null;

  // Mapa código -> caixa, evita varrer todas as caixas/materiais para cada item do histórico
  const boxIndexByCode = useMemo(() => {
    const map = new Map();
    for (const box of boxes) {
      for (const material of box.materials || []) {
        const key = normalizeValue(material.code);
        if (key && !map.has(key)) map.set(key, box);
      }
    }
    return map;
  }, [boxes]);

  // Memoizado: sem isso, estes cálculos (histórico × caixas) rodavam em CADA render/tecla
  const inventoryRecords = useMemo(
    () =>
      history.map((item) => ({
        ...item,
        description: displayColumns[0] ? item.rowData?.[displayColumns[0]] || "" : "",
        box: boxIndexByCode.get(normalizeValue(item.code)) || null
      })),
    [history, displayColumns, boxIndexByCode]
  );

  const filteredInventory = useMemo(() => {
    const term = normalizeValue(inventoryQuery);
    if (!term) return inventoryRecords;
    return inventoryRecords.filter((item) =>
      [item.code, item.description, item.box?.number, item.date, item.status]
        .some((value) => normalizeValue(value).includes(term))
    );
  }, [inventoryRecords, inventoryQuery]);

  const finalizeLoadedData = useCallback((hdrs, allRows, sheetName, fileLabel) => {
    const sheetsInfo = [{ name: sheetName, count: allRows.length }];
    setSheets(sheetsInfo);
    setSelectedSheets([sheetName]);
    setHeaders(hdrs);
    setRows(allRows);
    setFileName(fileLabel);
    const guessed = guessIdColumn(hdrs);
    setIdColumn(guessed);
    setDisplayColumns(hdrs.filter((h) => h !== guessed));
    setQuery("");
    setMatched(null);
    setSearchState("idle");
  }, []);

  const loadSheet = useCallback(async (buffer, sheetName, fileLabel) => {
    setIsLoadingSheet(true);
    setParseError("");
    try {
      if (typeof Worker !== "undefined") {
        const workerResult = await new Promise((resolve, reject) => {
          let worker;
          try { worker = new Worker(new URL("./services/excelWorker.js", import.meta.url), { type: "module" }); } catch (e) { reject(e); return; }
          const to = setTimeout(() => { try { worker.terminate(); } catch {} reject(new Error("worker-timeout")); }, 15000);
          worker.onmessage = (event) => { clearTimeout(to); worker.terminate(); const d = event.data || {}; if (d.error) reject(new Error(d.error)); else resolve(d); };
          worker.onerror = () => { clearTimeout(to); worker.terminate(); reject(new Error("worker-failed")); };
          worker.postMessage({ buffer: buffer.slice(0), sheetName }, [buffer.slice(0)]);
        });
        finalizeLoadedData(workerResult.headers, workerResult.rows, workerResult.sheetName, fileLabel);
      } else {
        const { headers: hdrs, rows: allRows } = excelService.readSheetFromBuffer(buffer, sheetName);
        finalizeLoadedData(hdrs, allRows, sheetName, fileLabel);
      }
    } catch (err) {
      try {
        const { headers: hdrs, rows: allRows } = excelService.readSheetFromBuffer(buffer, sheetName);
        finalizeLoadedData(hdrs, allRows, sheetName, fileLabel);
      } catch (fallbackErr) {
        console.error(fallbackErr);
        setParseError(fallbackErr?.message || "Não foi possível carregar a aba selecionada.");
      }
    } finally {
      setIsLoadingSheet(false);
    }
  }, [finalizeLoadedData]);

  const processFile = useCallback(async (file) => {
    if (!file) return;
    setAvailableSheets([]);
    setSelectedSheet("");
    setPendingBuffer(null);
    setPendingFileName("");
    setParseError("");
    const lowerName = file.name.toLowerCase();
    const isCsv = lowerName.endsWith(".csv");
    const isExcel = lowerName.endsWith(".xlsx") || lowerName.endsWith(".xls") || lowerName.endsWith(".xlsb");
    if (isCsv || !isExcel) {
      setIsParsing(true);
      try {
        const { sheets: parsedSheets, headers: hdrs, rows: allRows } = await excelService.readSpreadsheetFile(file);
        setSheets(parsedSheets);
        setSelectedSheets(parsedSheets.map((s) => s.name));
        setHeaders(hdrs);
        setRows(allRows);
        setFileName(file.name);
        const guessed = guessIdColumn(hdrs);
        setIdColumn(guessed);
        setDisplayColumns(hdrs.filter((h) => h !== guessed));
        setQuery("");
        setMatched(null);
        setSearchState("idle");
      } catch (err) {
        console.error(err);
        setParseError(err?.message || "Não foi possível ler este arquivo. Confirme se é um .xlsx, .xls ou .csv válido.");
      } finally { setIsParsing(false); }
      return;
    }
    setIsReadingWorkbook(true);
    try {
      const buffer = await file.arrayBuffer();
      setPendingBuffer(buffer);
      setPendingFileName(file.name);
      let sheetsInfo = null;
      if (typeof Worker !== "undefined") {
        try {
          sheetsInfo = await new Promise((resolve, reject) => {
            let worker;
            try { worker = new Worker(new URL("./services/excelWorker.js", import.meta.url), { type: "module" }); } catch (e) { reject(e); return; }
            const to = setTimeout(() => { try { worker.terminate(); } catch {} reject(new Error("worker-timeout")); }, 15000);
            worker.onmessage = (event) => { clearTimeout(to); worker.terminate(); const d = event.data || {}; if (d.error) reject(new Error(d.error)); else resolve(d.sheets || []); };
            worker.onerror = () => { clearTimeout(to); worker.terminate(); reject(new Error("worker-failed")); };
            worker.postMessage({ buffer: buffer.slice(0) }, [buffer.slice(0)]);
          });
        } catch { sheetsInfo = excelService.getAvailableSheetsFromBuffer(buffer); }
      } else {
        sheetsInfo = excelService.getAvailableSheetsFromBuffer(buffer);
      }
      if (!sheetsInfo || !sheetsInfo.length) throw new Error("Nenhuma aba foi encontrada neste arquivo.");
      setAvailableSheets(sheetsInfo);
      if (sheetsInfo.length === 1) {
        const only = sheetsInfo[0].name;
        setSelectedSheet(only);
        await loadSheet(buffer, only, file.name);
      }
    } catch (err) {
      console.error(err);
      setParseError(err?.message || "Não foi possível ler o arquivo.");
      setAvailableSheets([]);
      setPendingBuffer(null);
      setPendingFileName("");
    } finally { setIsReadingWorkbook(false); }
  }, [loadSheet]);

  const handleSheetConfirm = useCallback(async () => {
    if (!pendingBuffer || !selectedSheet) { setParseError("Selecione uma aba para continuar."); return; }
    if (!availableSheets.some((s) => s.name === selectedSheet)) { setParseError("Aba selecionada inválida."); return; }
    await loadSheet(pendingBuffer, selectedSheet, pendingFileName);
  }, [pendingBuffer, selectedSheet, pendingFileName, availableSheets, loadSheet]);

  const handleFileInput = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  };

  const resetAll = () => {
    setFileName("");
    setHeaders([]);
    setRows([]);
    setSheets([]);
    setSelectedSheets([]);
    setIdColumn("");
    setDisplayColumns([]);
    setQuery("");
    setMatched(null);
    setSearchState("idle");
    setParseError("");
    setAvailableSheets([]);
    setSelectedSheet("");
    setPendingBuffer(null);
    setPendingFileName("");
    setIsReadingWorkbook(false);
    setIsLoadingSheet(false);
    if (inputRef.current) { inputRef.current.value = ""; }
  };

  const suggestions = useMemo(() => {
    if (!readyToSearch || !query.trim()) {
      return [];
    }
    const q = query.trim().toLowerCase();
    const result = [];
    // parada antecipada: não varre a planilha inteira a cada tecla
    for (const row of selectedRows) {
      if (String(row[idColumn] ?? "").toLowerCase().includes(q)) {
        result.push(row);
        if (result.length >= 8) break;
      }
    }
    return result;
  }, [selectedRows, idColumn, query, readyToSearch]);

  const runSearch = (value) => {
    const q = String(value ?? query).trim().toLowerCase();
    if (!q) {
      setMatched(null);
      setSearchState("idle");
      return;
    }
    const exact = rowIndexByCode.get(normalizeValue(q));
    if (exact) {
      setMatched(exact);
      setSearchState("found");
    } else {
      setMatched(null);
      setSearchState("notfound");
    }
  };

  const loadHistory = () => {
    try {
      const savedHistory = storageService.loadHistory();
      setHistory(savedHistory);
      return savedHistory;
    } catch (error) {
      console.warn("Não foi possível carregar o histórico.", error);
      return [];
    }
  };

  const addToHistory = (code, exact, date, time) => {
    const rowData = exact
      ? headers.reduce((data, header) => ({
          ...data,
          [header]: exact[header] ?? ""
        }), {})
      : {};
    const status = exact ? "ENCONTRADO" : "NÃO ENCONTRADO";
    setHistory((previousHistory) => {
      const nextNumber = previousHistory.reduce(
        (highest, item) => Math.max(highest, Number(item.number) || 0),
        0
      ) + 1;
      const record = {
        number: nextNumber,
        date,
        time,
        code,
        status,
        sheetName: exact?.__sheetName || "",
        rowData
      };
      const nextHistory = [record, ...previousHistory];
      storageService.saveHistory(nextHistory);
      return nextHistory;
    });
  };

  const addMovement = (action, code, exact, boxNumber = "") => {
    const now = new Date();
    const movement = {
      id: `${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
      date: now.toLocaleDateString("pt-BR"),
      time: now.toLocaleTimeString("pt-BR", { hour12: false }),
      code,
      description: exact && displayColumns[0] ? exact[displayColumns[0]] || "" : "",
      action,
      box: boxNumber,
      user: ""
    };
    setMovements((previous) => [movement, ...previous]);
  };

  const createBox = () => {
    const now = new Date();
    const nextNumber = boxes.reduce((max, box) => Math.max(max, Number(box.number) || 0), 0) + 1;
    const box = {
      id: `box-${now.getTime()}`,
      number: String(nextNumber).padStart(3, "0"),
      description: newBoxDescription.trim(),
      note: newBoxNote.trim(),
      createdAt: now.toLocaleDateString("pt-BR"),
      status: "ABERTA",
      materials: []
    };
    setBoxes((previous) => [box, ...previous]);
    setActiveBoxId(box.id);
    setNewBoxDescription("");
    setNewBoxNote("");
  };

  const requestDeleteBox = (box) => setDeleteBoxCandidate(box);

  const confirmDeleteBox = () => {
    if (!deleteBoxCandidate) return;
    const materialCodes = (deleteBoxCandidate.materials || []).map((material) => normalizeValue(material.code));
    setBoxes((previous) => previous.filter((box) => box.id !== deleteBoxCandidate.id));
    if (materialCodes.length) {
      setHistory((previous) => {
        const nextHistory = previous.filter((item) => !materialCodes.includes(normalizeValue(item.code)));
        storageService.saveHistory(nextHistory);
        return nextHistory;
      });
    }
    setMovements((previous) => [{
      id: `box-delete-${Date.now()}`,
      date: new Date().toLocaleDateString("pt-BR"),
      time: new Date().toLocaleTimeString("pt-BR", { hour12: false }),
      code: `CX${deleteBoxCandidate.number}`,
      description: deleteBoxCandidate.description || "",
      action: "CAIXA EXCLUÍDA",
      box: deleteBoxCandidate.number,
      user: ""
    }, ...previous]);
    if (activeBoxId === deleteBoxCandidate.id) setActiveBoxId("");
    setDeleteBoxCandidate(null);
    setExportMessage(`CAIXA ${deleteBoxCandidate.number} excluída${materialCodes.length ? ` e ${materialCodes.length} material(is) removido(s) do estoque` : ""}.`);
  };

  const finishActiveBox = () => {
    if (!activeBox) return;
    setBoxes((previous) => previous.map((box) => box.id === activeBox.id ? { ...box, status: "ARMAZENADA" } : box));
    addMovement("CAIXA FINALIZADA", "", null, activeBox.number);
    setActiveBoxId("");
  };

  const buildMaterialRecord = (code, exact, date, time) => ({
    code,
    description: exact && displayColumns[0] ? exact[displayColumns[0]] || "" : "",
    date,
    time,
    // guarda todas as colunas originais da planilha para permitir exportação completa
    row: exact
      ? headers.reduce((data, header) => ({ ...data, [header]: exact[header] ?? "" }), {})
      : {}
  });

  const updateBoxForMaterial = (code, exact, date, time) => {
    if (!activeBox) return;
    const existingBox = boxIndexByCode.get(normalizeValue(code));
    if (existingBox && existingBox.id !== activeBox.id) {
      const shouldTransfer = window.confirm(`Este material já está armazenado na CAIXA ${existingBox.number}.\n\nOK: transferir para ${activeBox.number}\nCancelar: manter na caixa atual`);
      if (!shouldTransfer) return;
      setBoxes((previous) => previous.map((box) => {
        if (box.id === existingBox.id) return { ...box, materials: box.materials.filter((material) => normalizeValue(material.code) !== normalizeValue(code)) };
        if (box.id === activeBox.id) return { ...box, materials: [...(box.materials || []), buildMaterialRecord(code, exact, date, time)] };
        return box;
      }));
      addMovement("TRANSFERIDO", code, exact, activeBox.number);
      return;
    }
    if (existingBox && existingBox.id === activeBox.id) {
      if (!window.confirm("ATENÇÃO: este material já foi registrado nesta caixa.\n\nAdicionar novamente?")) return;
    }
    setBoxes((previous) => previous.map((box) => box.id === activeBox.id ? {
      ...box,
      materials: [...(box.materials || []), buildMaterialRecord(code, exact, date, time)]
    } : box));
    addMovement(existingBox ? "BIPADO NOVAMENTE" : "BIPADO", code, exact, activeBox.number);
  };

  const processQRCode = (value) => {
    const code = String(value ?? "").trim();
    const scannedBox = boxes.find((box) => normalizeValue(`CX${box.number}`) === normalizeValue(code) || normalizeValue(`CAIXA-${box.number}`) === normalizeValue(code) || normalizeValue(`CAIXA ${box.number}`) === normalizeValue(code));
    if (scannedBox) {
      setActiveBoxId(scannedBox.id);
      setLastProcessedCode(code);
      setSearchState("found");
      setExportMessage(`CAIXA ${scannedBox.number} ATIVA`);
      if (navigator.vibrate) navigator.vibrate(100);
      return;
    }
    if (!code || !readyToSearch) {
      if (searchInputRef.current) searchInputRef.current.focus();
      return;
    }
    const exact = rowIndexByCode.get(normalizeValue(code));
    const now = new Date();
    const date = now.toLocaleDateString("pt-BR");
    const time = now.toLocaleTimeString("pt-BR", { hour12: false });
    setLastProcessedCode(code);
    setQuery("");
    if (exact) {
      setMatched(exact);
      setSearchState("found");
    } else {
      setMatched(null);
      setSearchState("notfound");
    }
    addToHistory(code, exact, date, time);
    updateBoxForMaterial(code, exact, date, time);
    requestAnimationFrame(() => {
      if (searchInputRef.current) searchInputRef.current.focus();
    });
  };

  const clearHistory = () => {
    if (!history.length) return;
    if (window.confirm("Deseja realmente limpar todo o histórico de leituras?")) {
      storageService.removeHistory();
      setHistory([]);
    }
  };

  const exportHistory = () => {
    if (!history.length) return;
    excelService.exportHistoryWorkbook(history, headers);
  };

  const getExportRows = () => history.slice().reverse().map((item) => ({
    Codigo: item.code,
    Descricao: displayColumns[0] ? item.rowData?.[displayColumns[0]] || "" : "",
    Data: item.date,
    Hora: item.time,
    Usuario: item.user || "",
    Status: item.status,
    Caixa: boxIndexByCode.get(normalizeValue(item.code))?.number || ""
  }));

  const saveLocalHistory = async (format = "xlsx") => {
    if (!history.length) {
      setExportMessage("Não há bipagens para exportar.");
      return;
    }
    const fileName = getExportFileName(format);
    const rowsToExport = getExportRows();
    const blob = excelService.buildHistoryFileBlob(rowsToExport, format);
    try {
      if (window.showDirectoryPicker) {
        const directory = await window.showDirectoryPicker({ mode: "readwrite" });
        const root = await directory.getDirectoryHandle("Controle de Estoque", { create: true });
        const historyDirectory = await root.getDirectoryHandle("Historico", { create: true });
        const fileHandle = await historyDirectory.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
        setExportMessage("Histórico salvo com sucesso em: Controle de Estoque > Historico");
        return;
      }
    } catch (error) {
      if (error?.name === "AbortError") return;
    }
    const downloadService = excelService.downloadBlob(blob, fileName);
    setExportMessage(`Download criado: ${fileName}`);
  };

  const exportFullBackup = () => {
    const payload = backupService.buildBackupPayload({ history, boxes, movements, rows, headers, selectedSheets, idColumn, displayColumns });
    backupService.exportFullBackup(payload);
    setExportMessage("Backup completo exportado com sucesso.");
  };

  const restoreBackup = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const payload = JSON.parse(reader.result);
        if (payload.version !== constants.BACKUP_VERSION || !Array.isArray(payload.history) || !Array.isArray(payload.boxes)) throw new Error("Formato inválido");
        if (!window.confirm("Restaurar o backup substituirá os dados locais atuais. Continuar?")) {
          event.target.value = "";
          return;
        }
        setHistory(payload.history);
        setBoxes(payload.boxes);
        setMovements(Array.isArray(payload.movements) ? payload.movements : []);
        setRows(Array.isArray(payload.rows) ? payload.rows : []);
        setHeaders(Array.isArray(payload.headers) ? payload.headers : []);
        setSelectedSheets(Array.isArray(payload.selectedSheets) ? payload.selectedSheets : []);
        setIdColumn(payload.idColumn || "");
        setDisplayColumns(Array.isArray(payload.displayColumns) ? payload.displayColumns : []);
        storageService.saveHistory(payload.history);
        storageService.saveBoxes(payload.boxes);
        storageService.saveMovements(Array.isArray(payload.movements) ? payload.movements : []);
        setExportMessage("Backup restaurado com sucesso.");
      } catch (error) {
        setExportMessage("Não foi possível restaurar este backup.");
      }
      event.target.value = "";
    };
    reader.readAsText(file);
  };

  const exportAllClosedBoxes = () => {
    const closedBoxes = boxes.filter((box) => box.status === "ARMAZENADA" && (box.materials || []).length);
    if (!closedBoxes.length) {
      setExportMessage("Não há caixas finalizadas (cheias) para exportar.");
      return;
    }
    excelService.exportClosedBoxesWorkbook(closedBoxes);
    setExportMessage(`${closedBoxes.length} caixa(s) finalizada(s) exportada(s) em um único arquivo.`);
  };

  const exportBox = (box, format) => {
    if (!box) return;
    const rowsToExport = excelService.buildBoxRows(box);
    const worksheet = excelService.buildBoxRows(box);
    if (format === "pdf") {
      printService.printBoxPdf(box, rowsToExport);
      return;
    }
    if (format === "csv") {
      excelService.exportBoxSpreadsheet(box, format);
      return;
    }
    excelService.exportBoxSpreadsheet(box, "xlsx");
  };

  const searchExactCodeAutomatically = (value) => {
    const normalizedQuery = normalizeValue(value);
    if (!normalizedQuery) {
      return;
    }
    const exact = rowIndexByCode.get(normalizedQuery);
    if (exact) {
      setMatched(exact);
      setSearchState("found");
    }
  };

  const toggleColumn = (h) => {
    setDisplayColumns(
      (prev) =>
        prev.includes(h)
          ? prev.filter((c) => c !== h)
          : [...prev, h]
    );
  };

  const updateColorRule = (group, key, value) => {
    setColorRules((prev) => ({
      ...prev,
      [group]: {
        ...prev[group],
        [key]: value
      }
    }));
  };

  const addCodeColorRule = (rule) => {
    setCodeColorRules((previous) => [
      ...previous,
      { id: `rule-${Date.now()}`, prefix: rule.prefix, color: rule.color, label: rule.label || "" }
    ]);
  };

  const updateCodeColorRule = (id, changes) => {
    setCodeColorRules((previous) => previous.map((rule) => rule.id === id ? { ...rule, ...changes } : rule));
  };

  const removeCodeColorRule = (id) => {
    setCodeColorRules((previous) => previous.filter((rule) => rule.id !== id));
  };

  const toggleHighlightedField = (field) => {
    setHighlightedFields((previous) =>
      previous.includes(field)
        ? previous.filter((item) => item !== field)
        : [...previous, field]
    );
  };


  const onInputKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const scannedValue = e.currentTarget.value;
      processQRCode(scannedValue);
    }
  };

  const toggleSheet = (name, checked) => {
    setSelectedSheets((prev) => checked ? prev.filter((n) => n !== name) : [...prev, name]);
  };


  const onClearQuery = () => {
    setQuery("");
    setMatched(null);
    setSearchState("idle");
  };

  const handleSelectSection = (id) => {
    setActiveSection(id);
    setSidebarOpen(false);
  };



  return (
    <div className={`app-shell ${theme === "dark" ? "dark" : ""}`}>
      {/* Header */}
      <Header
        theme={theme}
        onToggleTheme={() => setTheme((current) => current === "dark" ? "light" : "dark")}
        onToggleMenu={() => setSidebarOpen((current) => !current)}
      />

      {/* Layout: Sidebar + Main content */}
      <div className="app-layout">
        <aside className={`app-sidebar${sidebarOpen ? " open" : ""}`}>
          <nav className="sidebar-nav">
            {MENU_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`sidebar-item${activeSection === item.id ? " active" : ""}`}
                onClick={() => handleSelectSection(item.id)}
              >
                <Icon name={item.icon} size={20} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {sidebarOpen && (
          <div
            className="sidebar-backdrop"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <main className="app-main">
          {/* Painel de status fixo (topo) */}
          <div className="status-bar-sticky">
            <Dashboard
              rows={rows}
              history={history}
              boxes={boxes}
              latestReading={latestReading}
            />
          </div>

          <div className="section-view" key={activeSection}>
            {/* Step 1: Import Spreadsheet */}
            {activeSection === "importar" && (
              <ImportadorPlanilha
                hasData={hasData}
                fileName={fileName}
                rowCount={rows.length}
                columnCount={headers.length}
                dragOver={dragOver}
                parseError={parseError}
                isParsing={isParsing}
                isReadingWorkbook={isReadingWorkbook}
                isLoadingSheet={isLoadingSheet}
                availableSheets={availableSheets}
                selectedSheet={selectedSheet}
                pendingFileName={pendingFileName}
                onSelectSheet={setSelectedSheet}
                onConfirmSheet={handleSheetConfirm}
                inputRef={inputRef}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onOpenPicker={() => inputRef.current?.click()}
                onFileInputChange={handleFileInput}
                onReset={resetAll}
              />
            )}

      {/* Step 2: Configure Columns */}
      {activeSection === "colunas" && (
        <ConfiguradorColunas
        hasData={hasData}
        headers={headers}
        idColumn={idColumn}
        displayColumns={displayColumns}
        highlightedFields={highlightedFields}
        highlightedFieldsColor={highlightedFieldsColor}
        sheets={sheets}
        selectedSheets={selectedSheets}
        colorRules={colorRules}
        highlightRule={highlightRule}
        codeColorRules={codeColorRules}
        onAddCodeColorRule={addCodeColorRule}
        onUpdateCodeColorRule={updateCodeColorRule}
        onRemoveCodeColorRule={removeCodeColorRule}
        onSelectIdColumn={setIdColumn}
        onToggleColumn={toggleColumn}
        onToggleHighlightedField={toggleHighlightedField}
        onHighlightedFieldsColorChange={setHighlightedFieldsColor}
        onToggleSheet={toggleSheet}
        onUpdateColorRule={updateColorRule}
        onHighlightColumnChange={(value) => setHighlightRule((prev) => ({ ...prev, column: value }))}
        onHighlightValueChange={(value) => setHighlightRule((prev) => ({ ...prev, value: value }))}
        onHighlightColorChange={(value) => setHighlightRule((prev) => ({ ...prev, color: value }))}
      />
      )}

      {/* Step 3 (PRINCIPAL): Search Material */}
      {activeSection === "busca" && (
        <BuscaMaterial
        readyToSearch={readyToSearch}
        idColumn={idColumn}
        query={query}
        searchState={searchState}
        matched={matched}
        matchedRowColor={matchedRowColor}
        matchedAvancoStatus={matchedAvancoStatus}
        matchedAvancoColor={matchedAvancoColor}
        matchedAvancoTextColor={matchedAvancoTextColor}
        matchedAvancoValue={matchedAvancoValue}
        matchedCodeColorRule={matchedCodeColorRule}
        matchedOrderNumber={matchedOrderNumber}
        matchedTraitColorRule={matchedTraitColorRule}
        suggestions={suggestions}
        displayColumns={displayColumns}
        highlightedFields={highlightedFields}
        highlightedFieldsColor={highlightedFieldsColor}
        lastProcessedCode={lastProcessedCode}
        searchInputRef={searchInputRef}
        codeColorRules={codeColorRules}
        onQueryChange={setQuery}
        onInputKeyDown={onInputKeyDown}
        onClearQuery={onClearQuery}
        onRunSearch={runSearch}
        onOpenScanner={() => {
          setScannerStatus("");
          setScannerOpen(true);
        }}
      />
      )}

      {/* Step 4: Historico + Movimentacoes lado a lado */}
      {activeSection === "historico" && (
        <div className="app-content">
          <div className="desktop-main-grid">
            <div className="panel-full">
              <Historico
                history={history}
                showFullHistory={showFullHistory}
                foundMaterialsCount={foundMaterialsCount}
                displayColumns={displayColumns}
                onExportHistory={exportHistory}
                onClearHistory={clearHistory}
                onSaveHistory={saveLocalHistory}
                onExportBackup={exportFullBackup}
                onRestoreFile={restoreBackup}
                onToggleFullHistory={() => setShowFullHistory((current) => !current)}
              />
            </div>

            <div>
              <Movimentacoes
                movements={movements}
                showFullHistory={showFullHistory}
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 5: Controle de Caixas / Armazenamento */}
      {activeSection === "caixas" && (
        <div style={{ maxWidth: 1200, margin: "0 auto 24px" }}>
          <ControleCaixas
            boxes={boxes}
            activeBoxId={activeBoxId}
            newBoxDescription={newBoxDescription}
            newBoxNote={newBoxNote}
            onNewBoxDescriptionChange={setNewBoxDescription}
            onNewBoxNoteChange={setNewBoxNote}
            onCreateBox={createBox}
            onSelectActiveBox={setActiveBoxId}
            onFinishBox={finishActiveBox}
            onExportBox={exportBox}
            onRequestDeleteBox={requestDeleteBox}
            onExportAllClosedBoxes={exportAllClosedBoxes}
          />
        </div>
      )}

      {/* Step 6: Consulta de Estoque */}
      {activeSection === "estoque" && (
        <ConsultaEstoque
          inventoryQuery={inventoryQuery}
          onInventoryQueryChange={setInventoryQuery}
          filteredInventory={filteredInventory}
        />
      )}

      {/* MÓDULO: Conferência de Ensaio */}
      {activeSection === "conferencia" && (
        <ConferenciaEnsaio
          rows={rows}
          headers={headers}
          idColumn={idColumn}
          displayColumns={displayColumns}
        />
      )}

      {exportMessage && (
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto 24px",
            padding: "12px 20px",
            borderRadius: 12,
            background: "var(--accent-bg)",
            border: "1px solid var(--accent-soft)",
            color: "var(--accent)",
            fontSize: 13,
            fontWeight: 600
          }}
        >
          {exportMessage}
        </div>
      )}
          </div>
        </main>

        <QRScanner
          open={scannerOpen}
          status={scannerStatus}
          videoRef={scannerVideoRef}
          onClose={() => setScannerOpen(false)}
        />

        <DeleteBoxModal
          candidate={deleteBoxCandidate}
          onCancel={() => setDeleteBoxCandidate(null)}
          onConfirm={confirmDeleteBox}
        />
      </div>
    </div>
  );
};

export default App;
