function MetricCard({ label, value, hint, accent }) {
  return (
    <div className="metric-card" style={{ borderLeftColor: accent }}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--muted)"
        }}
      >
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 8 }}>
        <span style={{ fontSize: 24, fontWeight: 800, color: "var(--text)", fontFamily: "'IBM Plex Mono', monospace" }}>
          {value}
        </span>
        {hint && (
          <span style={{ fontSize: 11, fontWeight: 700, color: accent }}>
            {hint}
          </span>
        )}
      </div>
    </div>
  );
}

export default function Dashboard({ rows = [], history = [], boxes = [], latestReading }) {
  const today = new Date().toLocaleDateString("pt-BR");
  const bipadosHoje = history.filter((item) => item.date === today).length;
  const caixasEmAberto = boxes.filter((box) => box.status !== "ARMAZENADA").length;
  const ultimaBipagem = latestReading ? `${latestReading.date} ${latestReading.time}` : "--";

  return (
    <div className="metric-grid">
      <MetricCard label="Itens na planilha" value={rows.length} accent="#EF4444" />
      <MetricCard label="Bipados hoje" value={bipadosHoje} accent="#22C55E" />
      <MetricCard label="Total de caixas" value={boxes.length} accent="#A78BFA" />
      <MetricCard label="Caixas em aberto" value={caixasEmAberto} accent="#60A5FA" />
      <MetricCard label="Última bipagem" value={ultimaBipagem} accent="#EAB308" />
    </div>
  );
}
