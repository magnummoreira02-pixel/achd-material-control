import Icon from "./ui/Icon.jsx";

export default function Historico({
  history = [],
  showFullHistory,
  foundMaterialsCount,
  displayColumns = [],
  onExportHistory,
  onClearHistory,
  onSaveHistory,
  onExportBackup,
  onRestoreFile,
  onToggleFullHistory
}) {
  const visible = history.slice(0, showFullHistory ? history.length : 10);

  return (
    <section className="panel-surface panel-full" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
      <header style={{ display: "flex", alignItems: "center", gap: 14, padding: "20px 24px", borderBottom: "1px solid var(--border)", flexWrap: "wrap" }}>
        <span className="step-badge" style={{ width: 28, height: 28, display: "inline-grid", placeItems: "center", borderRadius: "50%", background: "#22C55E", color: "#fff", fontSize: 13, fontWeight: 700 }}>4</span>
        <div style={{ flex: 1, minWidth: 180 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--text)" }}>Histórico de leituras</h2>
          <p style={{ fontSize: 13, color: "var(--muted)" }}>Acompanhe os materiais identificados pelos QR Codes</p>
        </div>
        <div className="panel-actions" style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {history.length > 0 && (
            <div className="history-counter">
              <span className="history-counter-value">{foundMaterialsCount}</span>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>Encontrados</span>
            </div>
          )}
          <button type="button" onClick={onExportHistory} disabled={!history.length} style={{ padding: "8px 14px", background: history.length ? "#22C55E" : "transparent", border: `1px solid ${history.length ? "#22C55E" : "var(--border-strong)"}`, color: history.length ? "#fff" : "var(--muted)", cursor: history.length ? "pointer" : "not-allowed", fontSize: 12 }}>EXPORTAR</button>
          <button type="button" onClick={onClearHistory} disabled={!history.length} style={{ padding: "8px 14px", background: "transparent", border: `1px solid ${history.length ? "#EF4444" : "var(--border-strong)"}`, color: history.length ? "#EF4444" : "var(--muted)", cursor: history.length ? "pointer" : "not-allowed", fontSize: 12 }}>LIMPAR</button>
          {history.length > 10 && (
            <button type="button" onClick={onToggleFullHistory} style={{ padding: "8px 14px", background: "transparent", border: "1px solid var(--border-strong)", color: "var(--text)", cursor: "pointer", fontSize: 12 }}>
              {showFullHistory ? "MOSTRAR ÚLTIMOS 10" : "VER TUDO"}
            </button>
          )}
        </div>
      </header>

      <div style={{ padding: "20px 24px" }}>
        {!history.length ? (
          <div style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--muted)", fontSize: 13 }}>
            <Icon name="history" size={20} />
            Os QR Codes bipados aparecerão aqui.
          </div>
        ) : (
          <>
            <div className="history-table-wrap" style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
                <thead>
                  <tr>
                    {["Nº", "Data", "Hora", "QR Code", "Status"].map((header) => (
                      <th key={header} style={{ textAlign: "left", padding: "8px 10px", borderBottom: "2px solid #22C55E", color: "var(--text)", whiteSpace: "nowrap" }}>{header}</th>
                    ))}
                    {displayColumns.slice(0, 2).map((header) => (
                      <th key={header} style={{ textAlign: "left", padding: "8px 10px", borderBottom: "2px solid #22C55E", color: "var(--text)", whiteSpace: "nowrap" }}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visible.map((item) => (
                    <tr key={`${item.number}-${item.date}-${item.time}`}>
                      <td style={{ padding: "7px 10px", borderBottom: "1px solid var(--border)", fontFamily: "'IBM Plex Mono', monospace", color: "var(--muted)" }}>{item.number}</td>
                      <td style={{ padding: "7px 10px", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap", color: "var(--text)" }}>{item.date}</td>
                      <td style={{ padding: "7px 10px", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap", color: "var(--text)" }}>{item.time}</td>
                      <td style={{ padding: "7px 10px", borderBottom: "1px solid var(--border)", fontFamily: "'IBM Plex Mono', monospace", color: "var(--text)" }}>{item.code}</td>
                      <td style={{ padding: "7px 10px", borderBottom: "1px solid var(--border)", fontWeight: 700, whiteSpace: "nowrap", color: item.status === "ENCONTRADO" ? "#22C55E" : "#EF4444" }}>{item.status}</td>
                      {displayColumns.slice(0, 2).map((header) => (
                        <td key={header} style={{ padding: "7px 10px", borderBottom: "1px solid var(--border)", color: "var(--text)" }}>{item.rowData?.[header] || "-"}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="history-cards" style={{ display: "none" }}>
              {visible.map((item) => (
                <article className="history-card" key={`card-${item.number}`}>
                  <div>
                    <div className="history-card-label">Código</div>
                    <div className="history-card-value history-card-code">{item.code}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="history-card-label">Status</div>
                    <div className="history-card-value" style={{ color: item.status === "ENCONTRADO" ? "#22C55E" : "#EF4444", fontWeight: 700 }}>{item.status}</div>
                  </div>
                  <div>
                    <div className="history-card-label">Data e hora</div>
                    <div className="history-card-value">{item.date} {item.time}</div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
