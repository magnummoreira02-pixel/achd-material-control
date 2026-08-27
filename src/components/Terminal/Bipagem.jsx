import React, { useState, useEffect, useRef, useCallback } from "react";
import Icon from "./../../../src/components/ui/Icon.jsx";
import { getCodeColorRule, normalizeValue } from "../../../src/utils/validation.js";

// Simulated barcode/QR reader - in production this would connect to a real scanner
// that sends keystrokes to the input field

export default function Bipagem({ ...props }) {
  const [lerValor, setLerValor] = useState("");
  const [resultado, setResultado] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [colunaChave, setColunaChave] = useState("id"); // default

  // Simulated list of materials from the loaded spreadsheet
  // In a real app, this would come from the app state
  const materiaisExemplo = [
    { id: "ABC123", codigo: "ABC123", descricao: "Material A", trait: "A", row: "1", range: "10-20" },
    { id: "DEF456", codigo: "DEF456", descricao: "Material B", trait: "B", row: "2", range: "21-30" },
    { id: "GHI789", codigo: "GHI789", descricao: "Material C", trait: "A", row: "3", range: "31-40" },
  ];

  // Process a scanned value
  const processarBip = async (valor) => {
    if (!valor || !valor.trim()) return;
    setLerValor(valor.trim());
    setCarregando(true);

    // Normalize the value for lookup
    const normValor = normalizeValue(valor);

    // Search in materials - in real app, this would use the actual spreadsheet data
    const resultados = materiaisExemplo.filter((m) =>
      normalizeValue(m.codigo).includes(normValor) ||
      normalizeValue(m.id).includes(normValor)
    );

    setCarregando(false);

    if (resultados.length === 0) {
      setResultado({
        tipo: "erro",
        mensagem: "⚠ MATERIAL NÃO ENCONTRADO NA CONFERÊNCIA ATUAL",
        dados: null,
        cor: "var(--danger)",
      });
      // Add to history as error
      const novoRegistro = {
        id: Date.now(),
        valor,
        status: "ERRO",
        timestamp: new Date().toISOString(),
        coluna: colunaChave,
      };
      setHistorico((prev) => [novoRegistro, ...prev]);
      return;
    }

    if (resultados.length === 1) {
      const mat = resultados[0];
      // Determine color by trait using existing getCodeColorRule logic
      const cor = getCodeColorRule({ [mat.trait || ""]: mat.trait || "" }) || "var(--text)";
      setResultado({
        tipo: "sucesso",
        mensagem: "✓ CONFERIDO",
        dados: {
          id: mat.id,
          codigo: mat.codigo,
          descricao: mat.descricao,
          row: mat.row,
          range: mat.range,
          trait: mat.trait,
        },
        cor: cor,
      });
      // Add to history as success
      const novoRegistro = {
        id: Date.now(),
        valor,
        status: "CONFERIDO",
        timestamp: new Date().toISOString(),
        coluna: colunaChave,
        dados: mat,
      };
      setHistorico((prev) => [novoRegistro, ...prev]);
    } else {
      // Multiple results
      setResultado({
        tipo: "aviso",
        mensagem: `⚠ ${resultados.length} MATERIAL(NIS) ENCONTRADO(S) - SELECIONE UM`,
        dados: resultados.map((m) => ({
          id: m.id,
          codigo: m.codigo,
          descricao: m.descricao,
        })),
        cor: "var(--warning)",
      });
      // Add to history as warning
      const novoRegistro = {
        id: Date.now(),
        valor,
        status: "CONFERÊNCIA",
        timestamp: new Date().toISOString(),
        coluna: colunaChave,
        multi: true,
        count: resultados.length,
      };
      setHistorico((prev) => [novoRegistro, ...prev]);
    }
  };

  // Clear results
  const limparResultado = () => {
    setLerValor("");
    setResultado(null);
  };

  // Add manual entry to history from UI
  const adicionarAoHistorico = (registro) => {
    setHistorico((prev) => [registro, ...prev]);
  };

  useEffect(() => {
    // In a real implementation, this would listen for scanner input
    // For now, we simulate focusing the input for scanner connection
    const input = document.querySelector('input[autofocus]');
    if (input) input.focus();
  }, []);

  return (
    <div className="terminal-bipagem-shell">
      <div className="terminal-bipagem-cabecalho">
        <h2>
          Bipagem / Conferência
          <Icon name="check" size={16} style={{ marginLeft: "4px" }} />
        </h2>
        <p style={{ fontSize: "12px", color: "#64748b" }}>
          Coluna-chave:{" "}
          <select
            style={{ fontSize: "12px", padding: "3px 6px" }}
            value={colunaChave}
            onChange={(e) => setColunaChave(e.target.value)}
          >
            <option value="id">ID</option>
            <option value="codigo">Código</option>
            <option value="descricao">Descrição</option>
          </select>
        </p>
      </div>

      {/* Leitura do código de barras/QR */}
      <div className="terminal-bipagem-leitura">
        <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "8px" }}>
          Aponte o leitor para o código de barras/QR code ou digite o valor:
        </p>

        <div style={{ position: "relative", marginBottom: "16px" }}>
          <input
            autoFocus
            style={{
              width: "100%",
              padding: "16px 20px",
              fontSize: "24px",
              fontFamily: "'IBM Plex Mono', monospace",
              background: "var(--surface-soft)",
              border: "2px solid var(--accent)",
              borderRadius: "10px",
              color: "#e8f0eb",
              outline: "none",
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => {
              // Change border color when focused for scanner
              e.target.style.borderColor = "#22C55E";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "var(--accent)";
            }}
            onKeyDown={(e) => {
              // Enter key - process the value
              if (e.key === "Enter") {
                e.preventDefault();
                const valor = e.target.value;
                processarBip(valor);
                // Reset input
                setTimeout(() => {
                  setLerValor("");
                  e.target.style.borderColor = "var(--accent)";
                  e.target.value = "";
                  e.target.focus();
                }, 100);
              }
            }}
            placeholder="Digite ou bipar o código..."
          />

          {/* Simulated scanner status */}
          {carregando && (
            <span style={{
              position: "absolute",
              right: "20px",
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: "12px",
              color: "#22C55E",
              animation: "pulse 1s infinite",
            }}>
              <Icon name="check" size={12} /> Lendo...
            </span>
          )}
        </div>

        {/* Result display */}
        {resultado && (
          <div style={{
            marginTop: "12px",
            padding: "12px",
            borderRadius: "8px",
            background: resultado.cor === "var(--danger)"
              ? "rgba(239, 68, 68, 0.12)"
              : resultado.cor === "var(--warning)"
                ? "rgba(251, 191, 36, 0.12)"
                : "rgba(34, 197, 94, 0.12)",
            border: `1px solid ${resultado.cor}`,
            color: resultado.cor,
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "13px",
          }}>
            <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
              {resultado.mensagem}
            </div>
            {resultado.dados && resultado.dados.id && (
              <div>
                <p>ID: {resultado.dados.id}</p>
                <p>Descrição: {resultado.dados.descricao}</p>
                <p>Linha: {resultado.dados.row} | Faixa: {resultado.dados.range}</p>
              </div>
            )}
            <button
              className="terminal-btn-terciario"
              style={{ marginTop: "8px", float: "right" }}
              onClick={limparResultado}
            >
              Limpar
            </button>
          )}
        )}

        {/* Multiple results selection */}
        {resultado && resultado.tipo === "aviso" && resultado.dados && resultado.dados.length > 0 && (
          <div style={{ marginTop: "12px" }}>
            <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "8px" }}>
              Selecione o material:
            </p>
            <div style={{ maxHeight: "200px", overflow: "auto" }}>
              {resultado.dados.map((m) => (
                <div
                  key={m.id}
                  style={{
                    padding: "8px",
                    margin: "4px 0",
                    background: "var(--surface)",
                    borderRadius: "4px",
                    cursor: "pointer",
                    border: "1px solid transparent",
                  }
                  onClick={() => {
                    // Select first result and process
                    const mat = resultado.dados.find((m2) => m2.id === m.id);
                    if (mat) {
                      // Simulate a successful bip with this material
                      const fakeResultado = {
                        tipo: "sucesso",
                        mensagem: "✓ CONFERIDO",
                        dados: { id: mat.id, codigo: mat.codigo, descricao: mat.descricao, row: mat.row, range: mat.range, trait: mat.trait },
                        cor: "var(--accent)",
                      };
                      setResultado(fakeResultado);
                      const novoRegistro = {
                        id: Date.now(),
                        valor: m.codigo,
                        status: "CONFERIDO",
                        timestamp: new Date().toISOString(),
                        coluna: colunaChave,
                        dados: mat,
                      };
                      setHistorico((prev) => [novoRegistro, ...prev]);
                    }
                  }}
                >
                  <p style={{ fontSize: "12px", margin: "0" }}>
                    <strong>{m.codigo}</strong> - {m.descricao}
                    <span style={{ fontSize: "10px", color: "#64748b" }}>Linha {m.row}, Faixa {m.range}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* History panel */}
        <div style={{ marginTop: "24px", maxHeight: "300px", overflow: "auto" }}>
          <p style={{ fontSize: "11px", color: "#64748b", marginBottom: "6px" }}>
            Histórico do Dia ({historico.length})
          </p>
          {historico.length === 0 ? (
            <p style={{ fontSize: "12px", color: "#94a3b8" }}>Nenhum bip registrado.</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "4px" }}>
              {historico.slice(0, 20).map((h) => {
                const statusClass =
                  h.status === "CONFERIDO"
                    ? "conf-sucesso"
                    : h.status === "ERRO"
                      ? "conf-erro"
                      : "conf-aviso";
                const statusText =
                  h.status === "CONFERIDO" ? "Conferido" : h.status === "ERRO" ? "Erro" : "Conferência";
                return (
                  <div
                    key={h.id}
                    style={{
                      padding: "6px 8px",
                      borderRadius: "4px",
                      fontSize: "10px",
                      background:
                        h.status === "CONFERIDO"
                          ? "rgba(34, 197, 94, 0.12)"
                          : h.status === "ERRO"
                            ? "rgba(239, 68, 68, 0.12)"
                            : "rgba(251, 191, 36, 0.12)",
                      border: `1px solid ${
                        h.status === "CONFERIDO"
                          ? "var(--accent)"
                          : h.status === "ERRO"
                            ? "var(--danger)"
                            : "var(--accent)"
                        }`,
                    }
                  >
                    <p style={{ fontSize: "10px", margin: "0 0 2px 0", fontWeight: "bold" }}>
                      {statusText}
                    </p>
                    <p style={{ fontSize: "9px", margin: "0" }}>
                      {h.valor || h.dados?.id || "—"}
                    </p>
                    <p style={{ fontSize: "8px", margin: "2px 0 0 0", color: "#64748b" }}>
                      {h.timestamp ? new Date(h.timestamp).toLocaleString() : "—"}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}