import Panel from "./ui/Panel.jsx";
import Icon from "./ui/Icon.jsx";

export default function ConsultaEstoque({
  inventoryQuery,
  onInventoryQueryChange,
  filteredInventory = []
}) {
  const rows = filteredInventory.filter((item) => item.status === "ENCONTRADO");

  return (
    <Panel
      step={6}
      title="Consulta de estoque"
      description="Descubra em qual caixa está armazenado cada material"
    >
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <input
          value={inventoryQuery}
          onChange={(e) => onInventoryQueryChange?.(e.target.value)}
          placeholder="Buscar por código, descrição ou nº da caixa..."
          style={{
            flex: 1,
            minWidth: 220,
            padding: "12px 16px",
            border: "1px solid var(--border)",
            background: "var(--surface-soft)",
            color: "var(--text)"
          }}
        />
      </div>

      {!rows.length ? (
        <div style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--muted)", fontSize: 13 }}>
          <Icon name="search" size={18} />
          {inventoryQuery
            ? "Nenhum material encontrado para essa busca."
            : "Nenhum material bipado ainda. Bipe materiais para consultar aqui em qual caixa estão."}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div
            className="inventory-row"
            style={{ background: "transparent", border: "none", padding: "0 14px", color: "var(--muted)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}
          >
            <span>Código</span>
            <span>Descrição</span>
            <span>Caixa</span>
            <span>Status da caixa</span>
            <span>Última leitura</span>
          </div>
          {rows.map((item) => (
            <div className="inventory-row" key={`${item.number}-${item.code}`}>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, color: "var(--text)", overflowWrap: "anywhere" }}>
                {item.code}
              </span>
              <span style={{ color: "var(--text)", overflowWrap: "anywhere" }}>
                {item.description || "-"}
              </span>
              <span style={{ fontWeight: 700, color: item.box ? "#22C55E" : "var(--muted)" }}>
                {item.box ? `CAIXA ${item.box.number}` : "Sem caixa"}
              </span>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>
                {item.box ? (item.box.status === "ARMAZENADA" ? "Finalizada" : "Aberta") : "-"}
              </span>
              <span style={{ fontSize: 12, color: "var(--muted)", whiteSpace: "nowrap" }}>
                {item.date} {item.time}
              </span>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
