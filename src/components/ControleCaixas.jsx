export default function ControleCaixas({
  boxes = [],
  activeBoxId,
  newBoxDescription,
  newBoxNote,
  onNewBoxDescriptionChange,
  onNewBoxNoteChange,
  onCreateBox,
  onSelectActiveBox,
  onFinishBox,
  onExportBox,
  onRequestDeleteBox,
  onExportAllClosedBoxes
}) {
  const closedBoxesCount = boxes.filter((box) => box.status === "ARMAZENADA" && (box.materials || []).length).length;

  return (
    <section className="panel-surface" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
      <header style={{ display: "flex", alignItems: "center", gap: 14, padding: "20px 24px", borderBottom: "1px solid var(--border)", flexWrap: "wrap" }}>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--text)" }}>Controle físico</h2>
          <p style={{ fontSize: 13, color: "var(--muted)" }}>Gerencie as caixas de armazenamento</p>
        </div>
        <button
          type="button"
          onClick={onExportAllClosedBoxes}
          disabled={!closedBoxesCount}
          title="Exporta todas as caixas finalizadas (cheias) em um único arquivo Excel"
          style={{
            padding: "10px 16px",
            background: "transparent",
            border: `1px solid ${closedBoxesCount ? "#22C55E" : "var(--border-strong)"}`,
            color: closedBoxesCount ? "#22C55E" : "var(--muted)",
            cursor: closedBoxesCount ? "pointer" : "not-allowed",
            fontSize: 12,
            whiteSpace: "nowrap"
          }}
        >
          EXPORTAR CAIXAS CHEIAS ({closedBoxesCount})
        </button>
      </header>

      <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input
            value={newBoxDescription}
            onChange={(e) => onNewBoxDescriptionChange?.(e.target.value)}
            placeholder="Descrição da nova caixa"
            style={{ flex: 1, minWidth: 180, padding: "10px 14px", border: "1px solid var(--border)", background: "var(--surface-soft)", color: "var(--text)" }}
          />
          <button
            type="button"
            onClick={onCreateBox}
            style={{ padding: "10px 20px", background: "#22C55E", color: "#fff", border: "none", cursor: "pointer", fontSize: 13 }}
          >
            NOVA CAIXA
          </button>
        </div>

        {!boxes.length ? (
          <div style={{ color: "var(--muted)", fontSize: 13 }}>Nenhuma caixa criada ainda.</div>
        ) : (
          boxes.map((box) => {
            const isActive = box.id === activeBoxId;
            const statusColor =
              box.status === "ARMAZENADA" ? "#94a3b8" : isActive ? "#22C55E" : "#60A5FA";
            return (
              <article
                key={box.id}
                style={{
                  padding: 16,
                  borderRadius: 14,
                  border: `1px solid ${isActive ? "#22C55E" : "var(--border)"}`,
                  boxShadow: isActive ? "0 0 0 3px rgba(34, 197, 94, 0.14)" : "none",
                  background: "var(--surface-soft)"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ display: "grid", placeItems: "center", width: 40, height: 40, borderRadius: 10, background: "rgba(34, 197, 94, 0.14)" }}>
                      📦
                    </span>
                    <div>
                      <div style={{ fontWeight: 800, color: "var(--text)", fontFamily: "'IBM Plex Mono', monospace" }}>CAIXA {box.number}</div>
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>
                        {(box.materials || []).length} item(ns){box.description ? ` · ${box.description}` : ""}
                      </div>
                    </div>
                  </div>
                  <span style={{ padding: "4px 12px", borderRadius: 999, fontSize: 11, fontWeight: 800, textTransform: "uppercase", background: `${statusColor}22`, color: statusColor }}>
                    {isActive ? "ATIVA" : box.status}
                  </span>
                </div>

                <div className="box-card-actions" style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
                  <button type="button" onClick={() => onSelectActiveBox?.(box.id)} disabled={box.status === "ARMAZENADA"} style={{ padding: "8px 14px", background: isActive ? "#22C55E" : "transparent", border: `1px solid ${box.status === "ARMAZENADA" ? "var(--border-strong)" : "#22C55E"}`, color: isActive ? "#fff" : box.status === "ARMAZENADA" ? "var(--muted)" : "#22C55E", cursor: box.status === "ARMAZENADA" ? "not-allowed" : "pointer", fontSize: 12 }}>
                    SELECIONAR
                  </button>
                  <button type="button" onClick={() => onExportBox?.(box, "xlsx")} style={{ padding: "8px 14px", background: "transparent", border: "1px solid var(--border-strong)", color: "var(--text)", cursor: "pointer", fontSize: 12 }}>
                    EXPORTAR
                  </button>
                  <button type="button" onClick={() => onExportBox?.(box, "pdf")} disabled={!box.materials?.length} style={{ padding: "8px 14px", background: "transparent", border: `1px solid ${box.materials?.length ? "#60A5FA" : "var(--border-strong)"}`, color: box.materials?.length ? "#60A5FA" : "var(--muted)", cursor: box.materials?.length ? "pointer" : "not-allowed", fontSize: 12 }}>
                    IMPRIMIR
                  </button>
                  {box.status !== "ARMAZENADA" && (
                    <button type="button" onClick={() => onFinishBox?.(box)} style={{ padding: "8px 14px", background: "transparent", border: "1px solid #EAB308", color: "#EAB308", cursor: "pointer", fontSize: 12 }}>
                      FINALIZAR
                    </button>
                  )}
                  <button type="button" onClick={() => onRequestDeleteBox?.(box)} style={{ padding: "8px 14px", background: "transparent", border: "1px solid #EF4444", color: "#EF4444", cursor: "pointer", fontSize: 12 }}>
                    EXCLUIR
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
