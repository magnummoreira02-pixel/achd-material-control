import { getHistoryByBox } from "../services/boxHistoryService.js";

export default function BoxHistoryPanel({ boxNumber }) {
  const list = getHistoryByBox(boxNumber);
  if (!list.length) return <div style={{ fontSize: 12, color: "var(--muted)" }}>Nenhuma impressão registrada.</div>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 180, overflowY: "auto" }}>
      {list.map((r) => (
        <div key={r.id} style={{ padding: "8px 10px", border: "1px solid var(--border)", borderRadius: 8, background: "var(--surface-soft)", fontSize: 12 }}>
          <div><strong>CAIXA {r.boxNumber}</strong> · {r.printer} · {r.connection} · {new Date(r.timestamp).toLocaleString("pt-BR")} · Qtd:{r.quantity} · {r.user} · <span style={{ color: r.status === "sent" ? "#16a34a" : "#dc2626" }}>{r.status}</span> · {r.action}</div>
          {r.trialId && <div style={{ fontSize: 11, color: "var(--muted)" }}>Ensaio: {r.trialId}</div>}
        </div>
      ))}
    </div>
  );
}
