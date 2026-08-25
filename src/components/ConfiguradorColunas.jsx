import { useState } from "react";
import Panel from "./ui/Panel.jsx";

export default function ConfiguradorColunas({
  hasData,
  headers = [],
  idColumn,
  displayColumns = [],
  highlightedFields = [],
  highlightedFieldsColor,
  sheets = [],
  selectedSheets = [],
  colorRules,
  highlightRule,
  codeColorRules = [],
  onSelectIdColumn,
  onToggleColumn,
  onToggleHighlightedField,
  onHighlightedFieldsColorChange,
  onToggleSheet,
  onUpdateColorRule,
  onHighlightColumnChange,
  onHighlightValueChange,
  onHighlightColorChange,
  onAddCodeColorRule,
  onUpdateCodeColorRule,
  onRemoveCodeColorRule
}) {
  const [newRulePrefix, setNewRulePrefix] = useState("");
  const [newRuleColor, setNewRuleColor] = useState("#22C55E");

  if (!hasData) return null;

  return (
    <Panel step={2} title="Configurar colunas" description="Escolha a coluna de código, as colunas exibidas e as planilhas ativas">
      <div style={{ display: "grid", gap: 20, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--muted)" }}>
            Coluna de código
          </label>
          <select
            value={idColumn}
            onChange={(e) => onSelectIdColumn?.(e.target.value)}
            style={{ width: "100%", marginTop: 8, padding: "10px 12px" }}
          >
            {headers.map((header) => (
              <option key={header} value={header}>{header}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--muted)" }}>
            Colunas exibidas
          </label>
          <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 8 }}>
            {displayColumns.map((column) => (
              <button
                key={column}
                type="button"
                onClick={() => onToggleColumn?.(column)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  border: `1px solid ${highlightedFields.includes(column) ? highlightedFieldsColor : "var(--border-strong)"}`,
                  background: highlightedFields.includes(column) ? `${highlightedFieldsColor}22` : "transparent",
                  color: "var(--text)"
                }}
              >
                {column}
              </button>
            ))}
          </div>
        </div>

        {sheets.length > 1 && (
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--muted)" }}>
              Planilhas ativas
            </label>
            <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
              {sheets.map((sheet) => (
                <label key={sheet.name} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--text)", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={selectedSheets.includes(sheet.name)}
                    onChange={(e) => onToggleSheet?.(sheet.name, !e.target.checked)}
                  />
                  {sheet.name} ({sheet.count})
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--border)" }}>
        <label style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--muted)" }}>
          Cor por prefixo de código
        </label>
        <p style={{ fontSize: 12, color: "var(--muted)", margin: "4px 0 12px" }}>
          Ex.: códigos que começam com "CE3" aparecem com selo roxo ao bipar.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
          {codeColorRules.map((rule) => (
            <div key={rule.id} style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ width: 14, height: 14, borderRadius: "50%", background: rule.color, flexShrink: 0 }} />
              <input
                value={rule.prefix}
                onChange={(e) => onUpdateCodeColorRule?.(rule.id, { prefix: e.target.value.toUpperCase() })}
                style={{ width: 90, padding: "6px 10px", border: "1px solid var(--border)" }}
              />
              <input
                type="color"
                value={rule.color}
                onChange={(e) => onUpdateCodeColorRule?.(rule.id, { color: e.target.value })}
                style={{ width: 36, height: 30, padding: 0, border: "1px solid var(--border)", cursor: "pointer" }}
              />
              <input
                value={rule.label || ""}
                placeholder="nome da cor (opcional)"
                onChange={(e) => onUpdateCodeColorRule?.(rule.id, { label: e.target.value })}
                style={{ flex: 1, minWidth: 100, padding: "6px 10px", border: "1px solid var(--border)" }}
              />
              <button
                type="button"
                onClick={() => onRemoveCodeColorRule?.(rule.id)}
                style={{ padding: "6px 10px", background: "transparent", border: "1px solid #EF4444", color: "#EF4444", cursor: "pointer", fontSize: 12 }}
              >
                REMOVER
              </button>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <input
            value={newRulePrefix}
            onChange={(e) => setNewRulePrefix(e.target.value.toUpperCase())}
            placeholder="Prefixo (ex: CE3)"
            style={{ width: 130, padding: "8px 10px", border: "1px solid var(--border)" }}
          />
          <input
            type="color"
            value={newRuleColor}
            onChange={(e) => setNewRuleColor(e.target.value)}
            style={{ width: 36, height: 34, padding: 0, border: "1px solid var(--border)", cursor: "pointer" }}
          />
          <button
            type="button"
            onClick={() => {
              if (!newRulePrefix.trim()) return;
              onAddCodeColorRule?.({ prefix: newRulePrefix.trim(), color: newRuleColor });
              setNewRulePrefix("");
            }}
            style={{ padding: "8px 16px", background: "#22C55E", border: "none", color: "#fff", cursor: "pointer", fontSize: 12 }}
          >
            ADICIONAR REGRA
          </button>
        </div>
      </div>
    </Panel>
  );
}
