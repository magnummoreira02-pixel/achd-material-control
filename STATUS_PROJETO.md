# STATUS PROJETO — ACHD MATERIAL CONTROL

**Atualizado em:** 27/08/2026
**Progresso geral:** 60% (Fase 1-4 100% + Fase 5 60%)

## Fase 5 — Módulo de Caixas + Auto-save (60% implementado 27/08/2026)
- **Parte 0 Histórico:** `services/boxHistoryService.js` (localStorage `box_print_history`, `addHistoryEntry`/`getHistoryByBox`/`getAllHistory`, toda `handlePrint` grava sent/error) — base para reimpressão/QR
- **Parte 7 Auto-save OneDrive:** `xlsx` já instalado, `print-server.js` nova rota `POST /save-inventory` separada de `/print` (não altera ZPL/USB), `hooks/useAutoSaveInventory.js` 30s (`estoqueDataRef`/`dirtyRef` em `App.jsx` ligado a `boxes`, falha silenciosa), caminho `C:\Users\mamore\OneDrive - Stine Seed\INVENTARIO\Estoque.xlsx`
- **Parte 1 Ensaio:** `boxLabelService.js` `trialId` (box.trialId||descricao||materials[0].ENSAIO), modal mostra Ensaio + QR `CAIXA:001` estável
- **Parte 3/4 Reimpressão segura:** `BoxLabelPrintModal` detecta `getHistoryByBox` → botão `REIMPRIMIR` + aviso data, confirmação `qty>1`, `imprimindo` travando botões
- **Parte 5 Histórico visível:** `components/BoxHistoryPanel.jsx` lista por caixa (ZT411/USB, data, qtd, trialId)
- **Parte 6 QR reversa:** `qrValue BOX:001`, `App.jsx processQRCode` reconhece `CAIXA:001` → ativa caixa
- **Partes 2/3 Tamanhos/Quantidade:** plug-and-play `LABEL_SIZES` + `mmToDots`, `qty 1-99` com disabled

**Build:** SUCESSO 27/08/2026 (144 modules) — `zplGenerator.js` e `/print` congelados
