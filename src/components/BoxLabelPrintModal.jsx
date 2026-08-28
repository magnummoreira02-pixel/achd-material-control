import { useEffect, useState } from "react";
import { LABEL_SIZES, LABEL_SIZE_IDS, DEFAULT_LABEL_SIZE_ID } from "../utils/labelSizes.js";
import { getBoxLabelPayload, generateQrDataUrl } from "../services/boxLabelService.js";
import { ZEBRA_PRINTERS, PRINTER_TYPES, DEFAULT_PRINTER_CONFIG, resolvePrinterConfig } from "../utils/printerConfig.js";
import { generateZplLabel } from "../services/zplGenerator.js";
import { commonPrint, thermalPrintZpl, sendToPrinterService, testPrint } from "../services/printerAdapters.js";
import { sendToBartender, getBartenderTemplate } from "../services/bartenderAdapter.js";
import { addHistoryEntry, getHistoryByBox } from "../services/boxHistoryService.js";
import BoxHistoryPanel from "./BoxHistoryPanel.jsx";

export default function BoxLabelPrintModal({ open, box, onClose }) {
  const [sizeId, setSizeId] = useState(DEFAULT_LABEL_SIZE_ID);
  const [qty, setQty] = useState(1);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [printerType, setPrinterType] = useState(PRINTER_TYPES.THERMAL);
  const [zebraModel, setZebraModel] = useState(DEFAULT_PRINTER_CONFIG.model);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [dpi, setDpi] = useState(DEFAULT_PRINTER_CONFIG.dpi);
  const [ip, setIp] = useState("");
  const [port, setPort] = useState(9100);
  const [connection, setConnection] = useState("usb");
  const printerName = "ZDesigner ZT411-203dpi ZPL";
  const [zplPreview, setZplPreview] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [statusError, setStatusError] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const imprimindo = isPrinting;

  const payload = box ? getBoxLabelPayload(box) : null;
  const labelSize = LABEL_SIZES[sizeId] || LABEL_SIZES[DEFAULT_LABEL_SIZE_ID];
  const printerConfig = resolvePrinterConfig({ type: printerType, model: zebraModel, dpi: Number(dpi) || 203, ip, port: connection === "usb" ? port : Number(port) || 9100, manufacturer: "Zebra", language: "ZPL", connection, name: printerName });

  useEffect(() => {
    if (!open || !payload) return;
    let cancelled = false;
    const qrSize = sizeId === "100x100" ? 220 : sizeId === "50x50" ? 160 : 110;
    generateQrDataUrl(payload.qrValue, qrSize).then((url) => {
      if (!cancelled) setQrDataUrl(url);
    });
    return () => { cancelled = true; };
  }, [open, payload?.qrValue, sizeId]);

  useEffect(() => {
    if (showAdvanced && printerType === PRINTER_TYPES.THERMAL && payload) {
      try { setZplPreview(generateZplLabel({ payload, labelSize, printerConfig })); } catch { setZplPreview(""); }
    } else { setZplPreview(""); }
  }, [showAdvanced, printerType, payload, labelSize, printerConfig]);

  useEffect(() => {
    if (!open) {
      setQty(1); setSizeId(DEFAULT_LABEL_SIZE_ID); setStatusMsg(""); setStatusError(false); setZplPreview("");
    }
  }, [open]);

  useEffect(() => {
    if (printerType === PRINTER_TYPES.THERMAL) {
      const preset = ZEBRA_PRINTERS[zebraModel];
      if (preset) setDpi(preset.dpi);
    }
  }, [zebraModel, printerType]);

  if (!open || !payload) return null;

  const isBartender = printerType === "bartender";
  const handleTest = async () => {
    setStatusMsg(""); setStatusError(false);
    try {
      if (!payload?.id) throw new Error("Caixa sem identificação.");
      if (!labelSize?.width || !labelSize?.height) throw new Error("Tamanho de etiqueta inválido.");
      if (!printerConfig) throw new Error("Impressora não configurada.");
      const r = await testPrint({ payload, labelSize, printerConfig });
      setZplPreview(r.zpl); setShowAdvanced(true);
      setStatusMsg("✅ ZPL validado com sucesso");
    } catch { setStatusMsg("❌ Não foi possível gerar o ZPL"); setStatusError(true); }
  };
  const handlePrint = async () => {
    if (imprimindo) return;
    const history = getHistoryByBox(payload.number);
    const alreadyPrinted = history.some((r) => r.status === "sent");
    if (alreadyPrinted && !window.confirm(`Esta caixa já foi impressa em ${new Date(history[0].timestamp).toLocaleString("pt-BR")}. Deseja reimprimir?`)) return;
    if (qtyNum > 1 && !window.confirm(`Confirma impressão de ${qtyNum} etiquetas?`)) return;
    setIsPrinting(true); setStatusMsg("🖨 Imprimindo..."); setStatusError(false);
    let status = "sent";
    try {
      if (!payload?.id) throw new Error("Caixa sem identificação.");
      if (!labelSize?.width || !labelSize?.height) throw new Error("Tamanho de etiqueta inválido.");
      if (!printerConfig) throw new Error("Impressora não configurada.");
      if (printerType === PRINTER_TYPES.COMMON) {
        await commonPrint({ payload, labelSize, quantity: qtyNum, qrDataUrl });
        setStatusMsg("✅ Etiqueta enviada para impressão"); setStatusError(false);
      } else if (isBartender) {
        setStatusMsg("❌ Erro ao imprimir etiqueta — BarTender — impressão manual (requer licença Automation)"); setStatusError(true);
        setZplPreview(`BarTender — impressão manual\nTemplate: ${getBartenderTemplate(labelSize)}\nDados: ${JSON.stringify({ boxNumber: `CAIXA ${payload.number}`, qrData: payload.qrValue, location: payload.description || "LRV" }, null, 2)}\nUse o Designer manualmente ou utilize Impressora térmica (Zebra ZPL).`);
        setShowAdvanced(true); status = "error";
      } else {
        const { zpl } = thermalPrintZpl({ payload, labelSize, printerConfig, quantity: qtyNum });
        if (!zpl || !zpl.includes("^XA")) throw new Error("ZPL inválido.");
        try { await sendToPrinterService({ zpl, printerConfig }); setStatusMsg("✅ Etiqueta enviada para impressão"); }
        catch (e) { setStatusMsg("❌ Erro ao enviar etiqueta"); setStatusError(true); status = "error"; setZplPreview(zpl); setShowAdvanced(true); }
      }
    } catch (e) {
      setStatusMsg("❌ Erro ao enviar etiqueta"); setStatusError(true); status = "error";
    } finally {
      addHistoryEntry({ boxNumber: payload.number, action: alreadyPrinted ? "reprinted" : "printed", printer: printerConfig.model || zebraModel, connection: printerConfig.connection || connection, quantity: qtyNum, status, trialId: payload.trialId || "" });
      setIsPrinting(false);
    }
  };

  const qtyNum = Math.max(1, Math.min(99, Number(qty) || 1));

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.55)", display: "grid", placeItems: "center", padding: 16 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 480, background: "var(--surface, #fff)", border: "1px solid var(--border, #e2e8f0)", borderRadius: 16, overflow: "hidden" }}
      >
        <header style={{ padding: "16px 20px", borderBottom: "1px solid var(--border, #e2e8f0)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: "var(--text, #111827)", margin: 0 }}>Preparar etiqueta</h3>
          <button type="button" onClick={onClose} style={{ background: "transparent", border: "none", fontSize: 20, cursor: "pointer", color: "var(--muted, #64748b)" }}>×</button>
        </header>

        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 13, color: "var(--muted, #64748b)" }}>Caixa: <strong style={{ color: "var(--text, #111827)" }}>CAIXA {payload.number}</strong> · {payload.count} itens{payload.description ? ` · ${payload.description}` : ""}</div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: "var(--muted, #64748b)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Tamanho da etiqueta</label>
            <select value={sizeId} onChange={(e) => setSizeId(e.target.value)} style={{ marginTop: 6, width: "100%", padding: "10px 12px", border: "1px solid var(--border-strong, #cbd5e1)", borderRadius: 8, background: "var(--surface-soft, #f8fafc)", color: "var(--text, #111827)" }}>
              {LABEL_SIZE_IDS.map((id) => (
                <option key={id} value={id}>{LABEL_SIZES[id].label}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: "var(--muted, #64748b)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Quantidade</label>
            <input type="number" min={1} max={99} value={qty} onChange={(e) => setQty(Math.max(1, Math.min(99, Number(e.target.value) || 1)))} style={{ marginTop: 6, width: 100, padding: "10px 12px", border: "1px solid var(--border-strong, #cbd5e1)", borderRadius: 8 }} />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: "var(--muted, #64748b)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Impressora</label>
            <select value={printerType} onChange={(e) => setPrinterType(e.target.value)} style={{ marginTop: 6, width: "100%", padding: "10px 12px", border: "1px solid var(--border-strong, #cbd5e1)", borderRadius: 8, background: "var(--surface-soft, #f8fafc)" }}>
              <option value={PRINTER_TYPES.COMMON}>Impressora comum (laser/jato/PDF)</option>
              <option value={PRINTER_TYPES.THERMAL}>Impressora térmica (Zebra ZPL)</option>
              <option value="bartender">BarTender — impressão manual</option>
            </select>
          </div>

          {isBartender && (
            <div style={{ padding: 12, background: "var(--surface-soft, #f1f5f9)", borderRadius: 8, border: "1px solid var(--border, #e2e8f0)", display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ fontSize: 11, color: "var(--muted)" }}>Modelo: <strong>{getBartenderTemplate(labelSize)}</strong> · Campos: BOX_NUMBER, LOCATION, QR_DATA · Impressora: {zebraModel} via BarTender</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div><label style={{ fontSize: 11, fontWeight: 700 }}>Modelo Zebra</label><select value={zebraModel} onChange={(e) => setZebraModel(e.target.value)} style={{ marginTop: 4, width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid var(--border-strong)" }}>{Object.keys(ZEBRA_PRINTERS).map((m) => <option key={m} value={m}>{m}</option>)}</select></div>
                <div><label style={{ fontSize: 11, fontWeight: 700 }}>IP BarTender (opcional)</label><input value={ip} onChange={(e) => setIp(e.target.value)} placeholder="localhost" style={{ marginTop: 4, width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid var(--border-strong)" }} /></div>
              </div>
              <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} style={{ fontSize: 12, background: "transparent", border: "none", color: "#22C55E", cursor: "pointer", textAlign: "left", padding: 0 }}>⚙ {showAdvanced ? "Ocultar" : "Ver dados enviados"}</button>
              {showAdvanced && zplPreview && <textarea readOnly value={zplPreview} style={{ width: "100%", minHeight: 80, fontFamily: "monospace", fontSize: 10, padding: 8, borderRadius: 8, border: "1px solid var(--border-strong)" }} />}
            </div>
          )}

          {printerType === PRINTER_TYPES.THERMAL && (
            <div style={{ padding: 12, background: "var(--surface-soft, #f1f5f9)", borderRadius: 8, border: "1px solid var(--border, #e2e8f0)", display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)" }}>Fabricante</label>
                  <select value="Zebra" disabled style={{ marginTop: 4, width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid var(--border-strong)" }}><option>Zebra</option></select>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)" }}>Modelo</label>
                  <select value={zebraModel} onChange={(e) => setZebraModel(e.target.value)} style={{ marginTop: 4, width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid var(--border-strong)" }}>
                    {Object.keys(ZEBRA_PRINTERS).map((m) => <option key={m} value={m}>{m} ({ZEBRA_PRINTERS[m].dpi}dpi)</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)" }}>Conexão</label>
                <select value={connection} onChange={(e) => setConnection(e.target.value)} style={{ marginTop: 4, width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid var(--border-strong)" }}>
                  <option value="usb">USB — {printerName} / USB001</option>
                  <option value="network">Rede — TCP/IP 9100</option>
                </select>
              </div>
              {connection === "usb" ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div><label style={{ fontSize: 11, fontWeight: 700 }}>Impressora</label><input value={printerName} disabled style={{ marginTop: 4, width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid var(--border-strong)" }} /></div>
                  <div><label style={{ fontSize: 11, fontWeight: 700 }}>Porta</label><input value="USB001" disabled style={{ marginTop: 4, width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid var(--border-strong)" }} /></div>
                </div>
              ) : null}
              <div style={{ fontSize: 11, color: "var(--muted)" }}>Linguagem: ZPL · DPI: {printerConfig.dpi} · {connection === "usb" ? "USB via Windows" : "Ethernet TCP 9100"} · localhost:3001</div>
              <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} style={{ fontSize: 12, background: "transparent", border: "none", color: "#22C55E", cursor: "pointer", textAlign: "left", padding: 0 }}>⚙ {showAdvanced ? "Ocultar" : "Configuração avançada"}</button>
              {showAdvanced && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div><label style={{ fontSize: 11, fontWeight: 700 }}>DPI</label><input type="number" value={dpi} onChange={(e) => setDpi(e.target.value)} style={{ marginTop: 4, width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid var(--border-strong)" }} /></div>
                    {connection === "network" && <div><label style={{ fontSize: 11, fontWeight: 700 }}>Porta</label><input type="number" value={port} onChange={(e) => setPort(e.target.value)} style={{ marginTop: 4, width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid var(--border-strong)" }} /></div>}
                  </div>
                  {connection === "network" && <div><label style={{ fontSize: 11, fontWeight: 700 }}>IP da Zebra</label><input value={ip} onChange={(e) => setIp(e.target.value)} placeholder="192.168.1.100" style={{ marginTop: 4, width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid var(--border-strong)" }} /></div>}
                  {zplPreview && (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 4 }}>ZPL gerado — BarTender/driver</div>
                      <textarea readOnly value={zplPreview} style={{ width: "100%", minHeight: 100, fontFamily: "monospace", fontSize: 10, padding: 8, borderRadius: 8, border: "1px solid var(--border-strong)" }} />
                      <button type="button" onClick={() => { navigator.clipboard?.writeText(zplPreview); setStatusMsg("ZPL copiado."); }} style={{ marginTop: 6, padding: "6px 12px", background: "#334155", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12 }}>Copiar ZPL</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {payload.trialId && <div style={{ fontSize: 11, color: "var(--muted)", textAlign: "center" }}>Ensaio: {payload.trialId}</div>}
          {getHistoryByBox(payload.number).length > 0 && <div style={{ fontSize: 11, color: "#d97706", textAlign: "center" }}>⚠ Já impressa em {new Date(getHistoryByBox(payload.number)[0].timestamp).toLocaleString("pt-BR")}</div>}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted, #64748b)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8, textAlign: "center" }}>Pré-visualização</div>
            <div style={{ display: "grid", placeItems: "center", padding: 16, background: "var(--surface-soft, #f1f5f9)", borderRadius: 12, border: "1px dashed var(--border, #e2e8f0)" }}>
              <div style={{ width: `${labelSize.width}mm`, height: `${labelSize.height}mm`, maxWidth: "100%", background: "#fff", border: "1px solid #0f172a", borderRadius: 4, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 4, overflow: "hidden", boxSizing: "border-box" }}>
                {sizeId === "45x18" ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, width: "100%", justifyContent: "space-between", padding: "0 4px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 1 }}><span style={{ fontWeight: 800, fontSize: 9, fontFamily: "monospace" }}>CAIXA {payload.number}</span><span style={{ fontSize: 6, color: "#475569" }}>LOCAL: {payload.description || "LRV"}</span></div>
                    {qrDataUrl ? <img src={qrDataUrl} alt="QR" style={{ width: 13 + "mm", height: 13 + "mm", objectFit: "contain" }} /> : <span style={{ fontSize: 8 }}>QR</span>}
                  </div>
                ) : sizeId === "50x50" ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                    <span style={{ fontWeight: 800, fontSize: 11, fontFamily: "monospace" }}>CAIXA {payload.number}</span>
                    {qrDataUrl ? <img src={qrDataUrl} alt="QR" style={{ width: 22 + "mm", height: 22 + "mm", objectFit: "contain" }} /> : null}
                    <span style={{ fontSize: 7, color: "#475569" }}>LRV</span>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                    <span style={{ fontWeight: 800, fontSize: 14, fontFamily: "monospace" }}>CAIXA {payload.number}</span>
                    {qrDataUrl ? <img src={qrDataUrl} alt="QR" style={{ width: 32 + "mm", height: 32 + "mm", objectFit: "contain" }} /> : null}
                    <span style={{ fontSize: 8, color: "#475569" }}>LRV{payload.description ? " · " + payload.description : ""}</span>
                    <span style={{ fontSize: 7, color: "#64748b" }}>{payload.count} itens{payload.createdAt ? " · " + payload.createdAt : ""}</span>
                  </div>
                )}
              </div>
              <div style={{ fontSize: 11, color: "var(--muted, #64748b)", marginTop: 8 }}>{labelSize.label} {qtyNum > 1 ? `· ${qtyNum} cópias` : ""}</div>
            </div>
          </div>
        </div>

        {statusMsg && <div style={{ margin: "0 20px", padding: "10px 12px", borderRadius: 8, background: statusError ? "rgba(239,68,68,0.12)" : "rgba(34,197,94,0.12)", border: `1px solid ${statusError ? "rgba(239,68,68,0.3)" : "rgba(34,197,94,0.3)"}`, color: statusError ? "#DC2626" : "#15803D", fontSize: 12 }}>{statusMsg}</div>}
        <div style={{ margin: "0 20px 10px" }}><BoxHistoryPanel boxNumber={payload.number} /></div>
        <footer style={{ padding: "14px 20px", borderTop: "1px solid var(--border, #e2e8f0)", display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" onClick={onClose} disabled={imprimindo} style={{ flex: 1, minWidth: 90, padding: "10px 12px", background: "transparent", border: "1px solid var(--border-strong, #cbd5e1)", borderRadius: 8, cursor: imprimindo ? "not-allowed" : "pointer" }}>Cancelar</button>
          <button type="button" onClick={handleTest} disabled={imprimindo} style={{ padding: "10px 14px", background: "transparent", border: "1px solid #60A5FA", color: "#60A5FA", borderRadius: 8, cursor: imprimindo ? "not-allowed" : "pointer", fontSize: 12, fontWeight: 700 }}>TESTAR IMPRESSÃO</button>
          <button type="button" onClick={handlePrint} disabled={imprimindo} style={{ flex: 1, minWidth: 110, padding: "10px 14px", background: imprimindo ? "#94a3b8" : "#22C55E", color: "#fff", border: "none", borderRadius: 8, cursor: imprimindo ? "not-allowed" : "pointer", fontWeight: 700 }}>{imprimindo ? "IMPRIMINDO..." : (getHistoryByBox(payload.number).length ? "🖨 REIMPRIMIR" : "🖨 IMPRIMIR")}</button>
        </footer>
      </div>
    </div>
  );
}
