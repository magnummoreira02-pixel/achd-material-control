# STATUS PROJETO — ACHD MATERIAL CONTROL

**Atualizado em:** 27/08/2026
**Progresso geral:** 60% (Fase 1 100% + Fase 2 60%)

## Implementado

### 1. Correções base
- `App.jsx` JSX duplicado corrigido; `npm run build` SUCESSO

### 2. Seleção de aba na importação (Fase 1)
- `excelService.js`: `getSheetNamesFromBuffer`, `readSheetFromBuffer`, `getAvailableSheetsFromBuffer`
- `excelWorker.js`: modo dual (listar abas / ler aba única)
- `App.jsx`: `processFile` Excel (listar → auto 1 aba / seletor N) + CSV original
- `ImportadorPlanilha.jsx`: seletor "Aba da planilha" + "Carregar aba"

### 3. Etiquetas Fase 1 (60% → base para Fase 2)
- `utils/labelSizes.js`: `LABEL_SIZES` 45x18/50x50/100x100 (mm)
- `services/boxLabelService.js`: `getBoxLabelPayload` (reusa `box.number`/`box.id`), `generateQrDataUrl` (qrcode 1.5.4), `printLabels` isolado com `#box-label-print-root` + `@media print` mm
- `components/BoxLabelPrintModal.jsx`: modal sem rota, pré-visualização proporcional, quantidade 1-99
- `ControleCaixas.jsx`: `🖨 ETIQUETA` por caixa

### 4. Fase 2 — Sistema Universal de Impressão (60% implementado)
- `utils/printerConfig.js`: `ZEBRA_PRINTERS` (ZD220 203dpi, ZT410 203dpi, ZT411 300dpi), `mmToDots(mm,dpi)=mm*dpi/25.4`, `PRINTER_TYPES` common/thermal, `resolvePrinterConfig`
- `services/zplGenerator.js`: `generateZplLabel({payload,labelSize,printerConfig})` → STRING ZPL isolada (BOX DATA → LABEL SIZE → ZPL), layouts 45x18/50x50/100x100, QR `CAIXA:001`
- `services/printerAdapters.js`: `commonPrint` (HTML/CSS mm → `window.print` isolado), `thermalPrintZpl`, `sendToPrinterService` (FRONTEND → SERVIÇO LOCAL → IMPRESSORA, suporta USB/Rede/IP:porta, erro controlado sem travar app)
- `BoxLabelPrintModal.jsx` evoluído: seletor Impressora [Comum | Térmica Zebra], quando térmica → Fabricante Zebra / Modelo ZD220/ZT410/ZT411 / DPI auto + `⚙ Configuração avançada` (DPI/IP/Porta, preview ZPL, copiar ZPL), mensagens "ZPL gerado"/"Enviada"/"Serviço indisponível" sem simular
- Arquitetura: `BOX DATA → LABEL TEMPLATE → LABEL SIZE → PRINT ENGINE → PRINTER ADAPTER (Common/Thermal/Zebra) → PRINTER` — desacoplada, permite Brother/Argox/TSC/Elgin/Honeywell futuro sem reescrever
- Reutiliza `qrcode`, `xlsx`, `LABEL_SIZES`; sem nova dependência, sem nova rota/aba, sem `window.open`

## Pendente Fase 2 (40%)
- Serviço local concreto (print-server.js) para USB direto
- Impressão em lote
- Detecção automática de impressoras (opcional, fallback manual mantido)

## Build
`npm run build` → SUCESSO 27/08/2026 (140 modules, 699kB)
