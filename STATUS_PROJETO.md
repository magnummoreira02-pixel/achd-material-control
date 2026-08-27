# STATUS PROJETO — ACHD MATERIAL CONTROL

**Atualizado em:** 27/08/2026
**Progresso geral:** 60% (Fase 1 100% + Fase 2 100% + Fase 3 60%)

## Fase 1 — Importação com seleção de aba
- `excelService.js`: `readSheetFromBuffer`, `getAvailableSheetsFromBuffer`
- `excelWorker.js`: modo dual (listar abas / ler aba única)
- `App.jsx`: fluxo Excel listar→auto 1 aba/seletor N + CSV original
- `ImportadorPlanilha.jsx`: seletor aba

## Fase 2 — Sistema Universal de Impressão
- `utils/labelSizes.js` + `utils/printerConfig.js` (ZEBRA_PRINTERS ZD220/ZT410/ZT411, mmToDots, dpi)
- `services/zplGenerator.js` (ZPL isolado) + `services/printerAdapters.js` (common/thermal)
- Modal com Comum/Térmica Zebra, config avançada, preview mm

## Fase 3 — Integração BarTender (60% implementado)
- `services/bartenderAdapter.js` (NOVO): `BarTenderAdapter` isolado — `getBartenderTemplate` (CAIXA_45x18.btw / 50x50 / 100x100 reutilizando `LABEL_SIZES`), `buildBartenderPayload` (boxId/boxNumber/location/qrData `CAIXA:001` reutilizando `box.number` real), `sendToBartender` via `APP → SERVIÇO LOCAL → BARTENDER → IMPRESSORA` (tenta `ip:port/bartender/print` + `localhost:3001/bartender/print`, erro controlado sem travar app, não simula impressão)
- `BoxLabelPrintModal.jsx`: método `[BarTender]` adicionado ao lado de Comum/Térmica; quando BarTender → mostra modelo .btw + campos BOX_NUMBER/QR_DATA/LOCATION + seletor Zebra ZD220/ZT410/ZT411 + IP opcional + dados enviados + fallback diagnóstico
- Arquitetura preservada: `PrintService → Common/Zebra/BarTender` adapters separados, sem reescrever Fase 1/2, sem `window.open`, sem nova rota/aba
- Reutiliza `LABEL_SIZES`, `ZEBRA_PRINTERS`, `box.number`/`box.id`; sem nova dependência
- Templates: `CAIXA_45x18.btw`, `CAIXA_50x50.btw`, `CAIXA_100x100.btw` (estrutura `templates/caixa/` preparada, caminho configurável via serviço local)

**Pendente Fase 3 (40%):** serviço local `print-server.js` endpoint `/bartender/print` concreto + Commander/Automation BTXML + testes físicos Zebra

**Build:** SUCESSO 27/08/2026 (141 modules)
