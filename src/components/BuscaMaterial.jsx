import Icon from "./ui/Icon.jsx";
import Panel from "./ui/Panel.jsx";
import { normalizeValue } from "../utils/validation.js";

export default function BuscaMaterial({
  readyToSearch,
  idColumn,
  query,
  searchState,
  matched,
  matchedRowColor,
  matchedAvancoStatus,
  matchedAvancoColor,
  matchedAvancoTextColor,
  matchedAvancoValue,
  matchedCodeColorRule,
  matchedOrderNumber,
  matchedTraitColorRule,
  suggestions = [],
  displayColumns = [],
  highlightedFields = [],
  highlightedFieldsColor,
  codeColorRules = [],
  lastProcessedCode,
  searchInputRef,
  onQueryChange,
  onInputKeyDown,
  onClearQuery,
  onRunSearch,
  onOpenScanner
}) {
  // borda forte: verde = avanço sim, vermelho = descarte/não selecionado
  const strongBorderColor =
    matchedAvancoStatus === "sim" ? "#22C55E" : matchedAvancoStatus === "nao" ? "#EF4444" : undefined;
  // cor da linha inteira: reutiliza exatamente "Cor por prefixo de código" aplicada ao TRAIT
  const traitColor = matchedTraitColorRule?.color || "";
  const orderNumberDisplay = matchedOrderNumber !== undefined && matchedOrderNumber !== null
    ? String(matchedOrderNumber).trim()
    : "";
  return (
    <Panel
      step={3}
      title="Buscar material"
      description={readyToSearch ? `Bipe o QR Code ou digite o código (${idColumn})` : "Importe uma planilha e configure a coluna de código para começar"}
    >
      <div className="reader-frame" style={{ display: "flex", gap: 12, padding: 16, flexWrap: "wrap" }}>
        <input
          ref={searchInputRef}
          value={query}
          disabled={!readyToSearch}
          placeholder="Buscar material / Bipar QR Code"
          onChange={(e) => onQueryChange?.(e.target.value)}
          onKeyDown={onInputKeyDown}
          style={{
            flex: 1,
            minWidth: 220,
            padding: "14px 18px",
            fontSize: 16,
            border: "1px solid var(--border)",
            background: "var(--surface-soft)",
            color: "var(--text)"
          }}
        />
        <div className="reader-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={onOpenScanner}
            disabled={!readyToSearch}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "14px 22px",
              background: "#EF4444",
              color: "#fff",
              border: "none",
              cursor: readyToSearch ? "pointer" : "not-allowed",
              fontSize: 13
            }}
          >
            <Icon name="camera" size={16} /> LER QR
          </button>
          <button
            type="button"
            onClick={() => onRunSearch?.(query)}
            disabled={!readyToSearch || !query.trim()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "14px 22px",
              background: "#2563EB",
              color: "#fff",
              border: "none",
              cursor: readyToSearch && query.trim() ? "pointer" : "not-allowed",
              fontSize: 13
            }}
          >
            <Icon name="search" size={16} /> BUSCAR
          </button>
        </div>
      </div>

      {suggestions.length > 0 && (
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
          {suggestions.map((row) => {
            const value = String(row[idColumn] ?? "");
            return (
              <button
                key={`${row.__sheetName}-${value}`}
                type="button"
                onClick={() => {
                  onQueryChange?.(value);
                  onRunSearch?.(value);
                }}
                style={{
                  textAlign: "left",
                  padding: "10px 14px",
                  background: "var(--surface-soft)",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  color: "var(--text)",
                  cursor: "pointer",
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 13
                }}
              >
                {value}
              </button>
            );
          })}
        </div>
      )}

      {searchState === "notfound" && (
        <div style={{ marginTop: 14, padding: "12px 16px", borderRadius: 10, background: "rgba(239, 68, 68, 0.12)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#EF4444", fontWeight: 700 }}>
          Material não encontrado.
        </div>
      )}

      {matched && (
        <div
          className="located-card"
          style={{
            marginTop: 14,
            borderRadius: 14,
            // Linha inteira colorida pelo TRAIT (Cor por prefixo de código).
            // Se não houver TRAIT/cor configurada, mantém o comportamento anterior.
            background: traitColor ? `${traitColor}29` : (matchedRowColor || "var(--surface-soft)"),
            overflow: "hidden",
            "--located-border": strongBorderColor
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              padding: "16px 20px",
              borderBottom: "1px solid var(--border)",
              background: strongBorderColor ? `${strongBorderColor}1A` : "transparent"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div className="located-code" style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, fontSize: 16, color: "var(--text)", overflowWrap: "anywhere" }}>
                {String(matched[idColumn] ?? "")}
              </div>
              {matchedCodeColorRule && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 12px",
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    background: `${matchedCodeColorRule.color}22`,
                    color: matchedCodeColorRule.color,
                    border: `1px solid ${matchedCodeColorRule.color}55`
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: matchedCodeColorRule.color }} />
                  {matchedCodeColorRule.prefix} · {matchedCodeColorRule.label || "COR"}
                </span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {orderNumberDisplay && (
                <div
                  title="Número de ordem (da planilha)"
                  style={{
                    display: "inline-flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: 56,
                    padding: "6px 14px",
                    borderRadius: 10,
                    background: "var(--surface)",
                    border: "1px solid var(--border-strong)",
                    lineHeight: 1.15
                  }}
                >
                  <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--muted)" }}>
                    Ordem
                  </span>
                  <span
                    style={{
                      color: "var(--text)",
                      fontWeight: 800,
                      fontSize: 18,
                      fontFamily: "'IBM Plex Mono', monospace",
                      textAlign: "center",
                      letterSpacing: "0.02em"
                    }}
                  >
                    {orderNumberDisplay}
                  </span>
                </div>
              )}
              {matchedAvancoStatus && (
                <span
                  style={{
                    padding: "8px 18px",
                    borderRadius: 999,
                    fontSize: 13,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    background: strongBorderColor,
                    color: "#fff",
                    boxShadow: `0 0 0 4px ${strongBorderColor}33`
                  }}
                >
                  {matchedAvancoStatus === "sim" ? "✔ AVANÇO" : "✕ DESCARTE"}
                </span>
              )}
              <button type="button" onClick={onClearQuery} style={{ background: "transparent", border: "1px solid var(--border-strong)", color: "var(--muted)", padding: "6px 10px", cursor: "pointer", fontSize: 12 }}>
                LIMPAR
              </button>
            </div>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <tbody>
              {(() => {
                // traitColor já vem calculado no topo do componente (matchedTraitColorRule),
                // reutilizando exatamente a mesma configuração "Cor por prefixo de código".
                return displayColumns.slice(0, 8).map((header) => {
                  const cellValue = String(matched[header] ?? "");
                  const isTraitColumn = normalizeValue(header) === "trait";
                  return (
                    <tr key={header}>
                      <td
                        style={{
                          padding: "9px 20px",
                          borderBottom: "1px solid var(--border)",
                          color: "var(--muted)",
                          width: 180,
                          background: traitColor ? `${traitColor}14` : undefined,
                          borderLeft: traitColor ? `3px solid ${traitColor}` : undefined
                        }}
                      >
                        {header}
                      </td>
                      <td
                        style={{
                          padding: "9px 20px",
                          borderBottom: "1px solid var(--border)",
                          background: traitColor ? `${traitColor}14` : undefined,
                          color: isTraitColumn && traitColor ? traitColor : (highlightedFields.includes(header) ? highlightedFieldsColor : "var(--text)"),
                          fontWeight: isTraitColumn && traitColor || highlightedFields.includes(header) ? 700 : 400,
                          overflowWrap: "anywhere"
                        }}
                      >
                        {cellValue || "-"}
                      </td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}
