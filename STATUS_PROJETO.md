# STATUS PROJETO — ACHD MATERIAL CONTROL

**Atualizado em:** 27/08/2026
**Progresso geral:** 60% (Fase 1 100% + Fase 2 100% + Fase 3 60% + Fase 4 60%)

## Fase 1 — Seleção de aba
- `excelService`/`excelWorker` modo dual, `App.jsx` listar→auto/seletor, `ImportadorPlanilha` seletor

## Fase 2 — Universal (Comum + Térmica ZPL)
- `labelSizes` 45x18/50x50/100x100 mm, `printerConfig` ZD220(203)/ZT410(203)/ZT411(300) + mmToDots, `zplGenerator` isolado, `printerAdapters` common/thermal

## Fase 3 — BarTender (60%)
- `bartenderAdapter` isolado (CAIXA_45x18/50x50/100x100.btw, BOX_NUMBER/QR_DATA), APP→SERVIÇO LOCAL→BARTENDER, sem contornar Starter

## Fase 4 — ZPL Direto incremental (60% — 27/08/2026)
- **3 arquivos autorizados** sem reescrever: `BoxLabelPrintModal.jsx` + `zplGenerator.js` + `printerAdapters.js`; `ControleCaixas.jsx`/`global.css`/`index.html` não alterados
- **Modal:** estado `imprimindo` (`isPrinting`+ alias `imprimindo`), botão `IMPRIMINDO...` disabled anti-duplo clique, `TESTAR IMPRESSÃO` valida box.id/tamanho/impressora/ZPL sem enviar, `IMPRIMIR` valida + `✅ Etiqueta enviada para impressão` / `❌ Erro ao imprimir etiqueta`
- **ZPL 45×18:** `marginX`/`marginY` 1.5mm + `qrSizeMm` 14mm parametrizados via `mmToDots(mm,dpi)`, `widthMm`/`heightMm`/`dpi` recebidos por `labelSize`/`printerConfig`, preparado para 50x50/100x50/100x100 sem duplicar layouts, QR `CAIXA:001` estável via `box.id`
- **Adapters:** `sendToPrinterService` preservado, adicionado `validatePrintRequest` + `testConnection()` leve (alias `testPrint`) sem impressão real, fluxo `Modal→zplGenerator→ZPL→sendToPrinterService→impressora`, suporte ZD220/ZT410/ZT411 via `printerConfig` (não hardcoded no gerador)

**Build:** SUCESSO 27/08/2026 (141 modules)
