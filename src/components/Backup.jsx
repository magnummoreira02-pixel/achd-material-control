export default function Backup({ historyLength = 0, onSaveHistory, onExportBackup, onRestoreFile }) {
  return (
    <div style={{ display: "inline-flex", gap: 10, flexWrap: "wrap" }}>
      <button
        type="button"
        onClick={() => onSaveHistory?.("xlsx")}
        disabled={!historyLength}
        style={{
          padding: "8px 14px",
          background: "transparent",
          border: `1px solid ${historyLength ? "#60A5FA" : "var(--border-strong)"}`,
          color: historyLength ? "#60A5FA" : "var(--muted)",
          cursor: historyLength ? "pointer" : "not-allowed",
          fontSize: 12
        }}
      >
        SALVAR LOCAL
      </button>
      <button
        type="button"
        onClick={onExportBackup}
        style={{
          padding: "8px 14px",
          background: "transparent",
          border: "1px solid var(--border-strong)",
          color: "var(--text)",
          cursor: "pointer",
          fontSize: 12
        }}
      >
        BACKUP COMPLETO
      </button>
    </div>
  );
}
