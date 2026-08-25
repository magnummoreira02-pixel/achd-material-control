import Icon from "./ui/Icon.jsx";

export default function Movimentacoes({ movements = [], showFullHistory }) {
  const visible = movements.slice(0, showFullHistory ? movements.length : 10);

  return (
    <section className="panel-surface" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
      <header style={{ display: "flex", alignItems: "center", gap: 14, padding: "20px 24px", borderBottom: "1px solid var(--border)" }}>
        <Icon name="history" size={20} color="#60A5FA" />
        <div>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--text)" }}>Movimentações</h2>
          <p style={{ fontSize: 13, color: "var(--muted)" }}>Últimas atividades registradas</p>
        </div>
      </header>

      <div style={{ padding: "16px 20px" }}>
        {!movements.length ? (
          <div style={{ color: "var(--muted)", fontSize: 13 }}>Nenhuma movimentação registrada.</div>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
            {visible.map((movement) => (
              <li
                key={movement.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 14px",
                  borderRadius: 12,
                  background: "var(--surface-soft)",
                  border: "1px solid var(--border)"
                }}
              >
                <span style={{ fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", color: "var(--muted)", whiteSpace: "nowrap" }}>
                  {movement.time}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: "0.04em",
                    padding: "3px 8px",
                    borderRadius: 999,
                    background:
                      movement.action === "CAIXA EXCLUÍDA"
                        ? "rgba(239, 68, 68, 0.14)"
                        : movement.action === "TRANSFERIDO"
                          ? "rgba(96, 165, 250, 0.14)"
                          : "rgba(34, 197, 94, 0.14)",
                    color:
                      movement.action === "CAIXA EXCLUÍDA"
                        ? "#EF4444"
                        : movement.action === "TRANSFERIDO"
                          ? "#60A5FA"
                          : "#22C55E",
                    whiteSpace: "nowrap"
                  }}
                >
                  {movement.action}
                </span>
                <span style={{ flex: 1, minWidth: 0, overflowWrap: "anywhere", color: "var(--text)", fontSize: 13, fontFamily: "'IBM Plex Mono', monospace" }}>
                  {movement.code}
                  {movement.box ? ` · CX${movement.box}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
