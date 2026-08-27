import Icon from "./ui/Icon.jsx";

export default function ImportadorPlanilha({
  hasData,
  fileName,
  rowCount,
  columnCount,
  dragOver,
  parseError,
  isParsing = false,
  isReadingWorkbook = false,
  isLoadingSheet = false,
  availableSheets = [],
  selectedSheet = "",
  pendingFileName = "",
  onSelectSheet,
  onConfirmSheet,
  inputRef,
  onDragOver,
  onDragLeave,
  onDrop,
  onOpenPicker,
  onFileInputChange,
  onReset
}) {
  const showSheetSelector = !hasData && availableSheets.length > 0;
  const isExcelPending = !!pendingFileName && !hasData;

  return (
    <section className="panel-surface" style={{ maxWidth: 1200, margin: "0 auto 24px", background: "var(--surface)", border: "1px solid var(--border)" }}>
      <header style={{ display: "flex", alignItems: "center", gap: 14, padding: "20px 24px", borderBottom: "1px solid var(--border)" }}>
        <span className="step-badge" style={{ width: 28, height: 28, display: "inline-grid", placeItems: "center", borderRadius: "50%", background: "#22C55E", color: "#fff", fontSize: 13, fontWeight: 700 }}>1</span>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--text)" }}>Importar planilha</h2>
          <p style={{ fontSize: 13, color: "var(--muted)" }}>Selecione o arquivo .xlsx, .xls ou .csv com os materiais</p>
        </div>
        {hasData && (
          <button type="button" onClick={onReset} style={{ padding: "8px 16px", background: "transparent", border: "1px solid var(--border-strong)", color: "var(--muted)", cursor: "pointer", fontSize: 12 }}>
            TROCAR PLANILHA
          </button>
        )}
      </header>

      <div style={{ padding: "20px 24px" }}>
        <input ref={inputRef} type="file" accept=".xlsx,.xls,.xlsb,.csv" onChange={onFileInputChange} style={{ display: "none" }} />

        {!hasData ? (
          <>
            <div
              className="drop-zone"
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={onOpenPicker}
              style={{
                border: `2px dashed ${dragOver ? "#22C55E" : "var(--border-strong)"}`,
                borderRadius: 14,
                padding: "48px 20px",
                textAlign: "center",
                cursor: "pointer",
                background: dragOver ? "rgba(34, 197, 94, 0.06)" : "var(--surface-soft)"
              }}
            >
              <Icon name="upload" size={36} color="#22C55E" />
              <div style={{ marginTop: 12, fontWeight: 700, color: "var(--text)" }}>
                Arraste a planilha aqui ou clique para selecionar
              </div>
              <div style={{ marginTop: 6, fontSize: 13, color: "var(--muted)" }}>
                Formatos aceitos: XLSX, XLS, XLSB, CSV
              </div>
              {(isParsing || isReadingWorkbook || isLoadingSheet) && (
                <div style={{ marginTop: 14, fontSize: 14, fontWeight: 700, color: "#22C55E" }}>
                  {isReadingWorkbook ? "Lendo abas do arquivo..." : isLoadingSheet ? "Carregando aba selecionada..." : "Processando planilha... aguarde"}
                </div>
              )}
            </div>

            {isExcelPending && (
              <div style={{ marginTop: 16, padding: "16px", borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface-soft)" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 4, overflowWrap: "anywhere" }}>
                  Arquivo: {pendingFileName}
                </div>
                {availableSheets.length > 0 ? (
                  <>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--muted)", marginTop: 12, marginBottom: 8 }}>
                      Aba da planilha
                    </label>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                      <select
                        value={selectedSheet}
                        onChange={(e) => onSelectSheet?.(e.target.value)}
                        style={{ flex: 1, minWidth: 180, padding: "10px 12px", border: "1px solid var(--border-strong)", borderRadius: 8, background: "var(--surface)", color: "var(--text)", fontSize: 13 }}
                      >
                        <option value="">Selecione a aba</option>
                        {availableSheets.map((s) => (
                          <option key={s.name} value={s.name}>{s.name} ({s.count} linhas)</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={onConfirmSheet}
                        disabled={!selectedSheet || isLoadingSheet}
                        style={{ padding: "10px 18px", background: !selectedSheet || isLoadingSheet ? "var(--border-strong)" : "#22C55E", color: "#fff", border: "none", borderRadius: 8, cursor: !selectedSheet || isLoadingSheet ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 700, whiteSpace: "nowrap" }}
                      >
                        {isLoadingSheet ? "Carregando..." : "Carregar aba"}
                      </button>
                    </div>
                  </>
                ) : isReadingWorkbook ? (
                  <div style={{ marginTop: 10, fontSize: 13, color: "var(--muted)" }}>Identificando abas...</div>
                ) : null}
              </div>
            )}
          </>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <div className="located-code" style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 220 }}>
              <Icon name="check" size={18} color="#22C55E" />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, color: "var(--text)", overflowWrap: "anywhere" }}>{fileName}</div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>{rowCount} linhas · {columnCount} colunas</div>
              </div>
            </div>
          </div>
        )}

        {parseError && (
          <div style={{ marginTop: 14, padding: "12px 16px", borderRadius: 10, background: "rgba(239, 68, 68, 0.12)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#EF4444", fontSize: 13 }}>
            {parseError}
          </div>
        )}
      </div>
    </section>
  );
}
