import React, { useState, useEffect, useRef, useCallback } from "react";
import Icon from "./../../../src/components/ui/Icon.jsx";
import { TemplateType, DefaultDimensions, createDefaultElement } from "../../../src/services/labelTemplateService.js";

// Mapeamento de tipos para rótulos visuais
const TYPE_LABELS = {
  [TemplateType.TEXTO]: "Texto",
  [TemplateType.CAMPO]: "Campo da Planilha",
  [TemplateType.QR_CODE]: "QR Code",
  [TemplateType.CODIGO_BARRAS]: "Código de Barras",
  [TemplateType.RANGE]: "Faixa (Range)",
  [TemplateType.SERPENTINE]: "Serpentine",
};

const ALIGNMENTS = ["esq", "cent", "dir"];
const ORIENTATIONS = ["horizontal", "vertical"];

// Helper: format element for display
function formatElemento(el) {
  const tipoLabel = TYPE_LABELS[el.tipo] || el.tipo;
  const dims = el.larguraFixa || el.alturaFixa ? (el.larguraFixa ? "Largura fixa" : "Altura fixa") : "—";
  return {
    id: el.id.substring(0, 6),
    tipo: tipoLabel,
    x: el.x,
    y: el.y,
    fonte: el.fonteMm + "mm",
    negrito: el.negrito ? "Bold" : "Normal",
    alinh: el.alinhamento,
    rot: el.rotacao,
    dimas: dimas,
  };
}

export default function EditorEtiqueta({ match, ...props }) {
  const [template, setTemplate] = useState(null);
  const [elementos, setElementos] = useState([]);
  const [selectedElementId, setSelectedElementId] = useState(null);
  const [nomeModelo, setNomeModelo] = useState("");
  const [larguraMM, setLarguraMM] = useState(DefaultDimensions.largura);
  const [alturaMM, setAlturaMM] = useState(DefaultDimensions.altura);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [novoElementoTipo, setNovoElementoTipo] = useState(TemplateType.TEXTO);
  const [novoElementoColuna, setNovoElementoColuna] = useState("");
  const [novoElementoPrefixo, setNovoElementoPrefixo] = useState("");
  const [novoElementoTextoFixo, setNovoElementoTextoFixo] = useState("");
  const [showExportJson, setShowExportJson] = useState(false);

  // Load template on mount
  useEffect(() => {
    const loadTemplate = async () => {
      const id = match?.params?.id;
      if (id) {
        const t = await (await import("../../../src/services/labelTemplateService.js")).getTemplate(id);
        if (t) {
          setTemplate(t);
          setNomeModelo(t.nome || "Novo Modelo");
          setLarguraMM(t.dimensoes?.largura || DefaultDimensions.largura);
          setAlturaMM(t.dimensoes?.altura || DefaultDimensions.altura);
          setElementos(t.elementos || []);
        }
      } else {
        // New template
        setNomeModelo("Novo Modelo");
        setElementos([]);
      }
    };
    loadTemplate();
  }, [match]);

  // Save template
  const salvarTemplate = async () => {
    const t = {
      id: template?.id || Date.now().toString(),
      nome: nomeModelo || "Novo Modelo",
      ativo: false,
      dimensoes: { largura: larguraMM, altura: alturaMM },
      elementos: elementos,
    };
    await (await import("../../../src/services/labelTemplateService.js")).saveTemplate(t);
    // Also save to active
    await (await import("../../../src/services/labelTemplateService.js")).setActiveTemplate(t.id);
    // Refresh parent
    const refresh = props.onTemplateSaved;
    if (refresh) refresh();
    setShowExportJson(false);
    alert("Modelo salvo com sucesso!");
  };

  // Add new element
  const handleAddElemento = () => {
    let novo;
    switch (novoElementoTipo) {
      case TemplateType.TEXTO:
        novo = createDefaultElement(TemplateType.TEXTO, {
          textoFixo: "Novo texto",
        });
        break;
      case TemplateType.CAMPO:
        if (!novoElementoColuna) {
          alert("Selecione uma coluna da planilha.");
          return;
        }
        novo = createDefaultElement(TemplateType.CAMPO, {
          colunaOrigem: novoElementoColuna,
          prefixo: novoElementoPrefixo || undefined,
          textoFixo: novoElementoTextoFixo || undefined,
        });
        break;
      case TemplateType.QR_CODE:
        novo = createDefaultElement(TemplateType.QR_CODE, {});
        break;
      case TemplateType.CODIGO_BARRAS:
        novo = createDefaultElement(TemplateType.CODIGO_BARRAS, {});
        break;
      case TemplateType.RANGE:
        novo = createDefaultElement(TemplateType.RANGE, {});
        break;
      case TemplateType.SERPENTINE:
        novo = createDefaultElement(TemplateType.SERPENTINE, {});
        break;
      default:
        novo = createDefaultElement(TemplateType.TEXTO);
    }
    setElementos((prev) => [...prev, novo]);
    setShowAddDialog(false);
  };

  // Remove element
  const handleRemoverElemento = (id) => {
    setElementos((prev) => prev.filter((e) => e.id !== id));
    if (selectedElementId === id) setSelectedElementId(null);
  };

  // Select element
  const handleSelecionarElemento = (id) => {
    setSelectedElementId(id);
  };

  // Export JSON
  const handleExportarJSON = () => {
    const data = {
      template: nomeModelo,
      versao: "1.0",
      elementos: elementos.map(formatElemento),
      dimensoes: { largura: larguraMM, altura: alturaMM },
    };
    setShowExportJson(true);
    // Trigger download
    const dataStr =
      "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
    const downloadNode = document.createElement("a");
    downloadNode.setAttribute("href", dataStr);
    downloadNode.setAttribute(
      "download",
      `${nomeModelo}_${new Date().toISOString().split("T")[0]}.json`
    );
    downloadNode.click();
  };

  // UI - Form to add element
  const colunasPossiveis = [
    "id",
    "codigo",
    "range",
    "faixa",
    "local",
    "plantador",
    "quadra",
    "row",
    "sentido",
    "entry",
    "entryPrefix",
    "entrySuffix",
    "rep",
    "bookName",
  ];

  return (
    <div className="editor-etiqueta-shell">
      <div className="editor-etiqueta-topo">
        <h2>
          {template ? `Editor: ${template.nome}` : "Editor de Etiqueta"} 
          <Icon name="{" size={16} style={{ marginLeft: "4px" }} />}
        </h2>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <span style={{ fontSize: "12px", color: "#64748b" }}>
            {larguraMM}x{alturaMM}mm
          </span>
          <Icon name="resize" size={12} style={{ cursor: "pointer", color: "#22C55E" }} onClick={() => alert("Redimensionamento via preview ao vivo") />}
        </div>
        <button
          className="terminal-btn-secondary"
          style={{ marginLeft: "auto" }}
          onClick={salvarTemplate}
        >
          <Icon name="save" size={16} /> Salvar Modelo
        </button>
        <button
          className="terminal-btn-secondary"
          style={{ marginLeft: "8px" }}
          onClick={handleExportarJSON}
        >
          <Icon name="download" size={16} /> Exportar JSON
        </button>
        <button
          className="terminal-btn-secondary"
          style={{ marginLeft: "8px" }}
          onClick={() => setShowExportJson(true)}
        >
          <Icon name="eye" size={16} /> Visualizar JSON
        </button>
      </div>

      {/* Left panel: Element properties and add form */}
      <div className="editor-etiqueta-panel-esquerdo">
        {/* Selected element properties */}
        {selectedElementId !== null && template && template.elementos.length > 0
          ? (
            <div className="element-prop-box">
              <h3>Propriedades do Elemento</h3>
              const el = template.elementos.find((e) => e.id === selectedElementId);
              if (!el) return null;

              return (
                <div>
                  <p style={{ fontSize: "11px", color: "#64748b", marginBottom: "8px" }}>Tipo:</p>
                  <select
                    style={{
                      width: "100%",
                      padding: "6px",
                      marginBottom: "8px",
                      borderRadius: "4px",
                      background: "var(--surface)",
                      color: "#e8f0eb",
                      border: "1px solid var(--border)",
                    }}
                    onChange={(e) => {
                      const tipo = e.target.value as any;
                      setElementos((prev) =>
                        prev.map((e) =>
                          e.id === selectedElementId
                            ? { ...e, tipo: tipo as any }
                            : e
                        )
                      );
                    }}
                  >
                    <option value={TemplateType.TEXTO}>Texto</option>
                    <option value={TemplateType.CAMPO}>Campo da Planilha</option>
                    <option value={TemplateType.QR_CODE}>QR Code</option>
                    <option value={TemplateType.CODIGO_BARRAS}>Código de Barras</option>
                    <option value={TemplateType.RANGE}>Range</option>
                    <option value={TemplateType.SERPENTINE}>Serpentine</option>
                  </select>
                  <p style={{ fontSize: "11px", color: "#64748b", marginBottom: "8px" }}>
                    Alinhamento:
                  </select>
                  {/* Alignment select would go here - simplified */}
                  <p style={{ fontSize: "11px", color: "#64748b", marginBottom: "8px" }}>
                    Fonte (mm):
                  </p>
                  <input
                    type="number"
                    min="1"
                    step="0.1"
                    value el.fonteMm || 3
                    onChange={(e) =>
                      setElementos(
                        prev =>
                          prev.map((e) =>
                            e.id === selectedElementId
                              ? { ...e, fonteMm: parseFloat(e.target.value) || 3 }
                              : e
                          )
                      )
                    }
                    style={{ width: "100%", padding: "6px", marginBottom: "8px" }}
                  />
                  <p style={{ fontSize: "11px", color: "#64748b", marginBottom: "8px" }}>
                    Negrito:
                  </p>
                  <label style={{ display: "flex", gap: "4px" }}>
                    <input
                      type="checkbox"
                      checked={el.negrito}
                      onChange={(e) =>
                        setElementos(
                          prev =>
                            prev.map((e) =>
                              e.id === selectedElementId
                                ? { ...e, negrito: e.target.checked }
                                : e
                            )
                        )
                      }
                      style={{ transform: "scale(1.2)" }}
                    />
                    Sim
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={!el.negrito}
                      onChange={(e) =>
                        setElementos(
                          prev =>
                            prev.map((e) =>
                              e.id === selectedElementId
                                ? { ...e, negrito: false }
                                : e
                            )
                        )
                      }
                      style={{ transform: "scale(1.2)" }}
                    />
                    Não
                  </label>
                </div>
              );
            </div>
          )
          : null}

        {/* Add new element form */}
        <div className="add-element-box" style={{ marginTop: "24px" }}>
          <h3>Adicionar Novo Elemento</h3>
          <select
            style={{
              width: "100%",
              padding: "8px",
              marginBottom: "8px",
              borderRadius: "4px",
              background: "var(--surface)",
              color: "#e8f0eb",
              border: "1px solid var(--border)",
            }}
            onChange={(e) => setNovoElementoTipo(e.target.value as any)}
          >
            <option value={TemplateType.TEXTO}>Texto fixo</option>
            <option value={TemplateType.CAMPO}>Campo da planilha</option>
            <option value={TemplateType.QR_CODE}>QR Code</option>
            <option value={TemplateType.CODIGO_BARRAS}>Código de Barras</option>
            <option value={TemplateType.RANGE}>Range</option>
            <option value={TemplateType.SERPENTINE}>Serpentine</option>
          </select>

          {/* Campo da planilha fields (show only when Campo selected) */}
          {novoElementoTipo === TemplateType.CAMPO && (
            <div style={{ marginBottom: "8px" }}>
              <label style={{ fontSize: "11px", color: "#64748b" }}>Coluna:</label>
              <select
                style={{ width: "100%", padding: "6px", marginBottom: "4px" }}
                onChange={(e) => setNovoElementoColuna(e.target.value)}
              >
                <option value="">-- Selecione --</option>
                {colunasPossiveis.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <label style={{ fontSize: "11px", color: "#64748b" }}>
                Prefixo (opcional)
              </label>
              <input
                type="text"
                value={novoElementoPrefixo || ""}
                onChange={(e) => setNovoElementoPrefixo(e.target.value)}
                style={{ width: "100%", padding: "6px", marginBottom: "4px" }}
              />
            </div>
          )}

          <div style={{ marginBottom: "8px" }}>
            <label style={{ fontSize: "11px", color: "#64748b" }}>Texto fixo / Prefixo:</label>
            <input
              type="text"
              value={novoElementoTextoFixo || ""}
              onChange={(e) => setNovoElementoTextoFixo(e.target.value)}
              style={{ width: "100%", padding: "6px" }}
            />
          </div>

          <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
            <button
              className="terminal-btn-secondary"
              style={{ flex: 1, padding: "6px" }}
              onClick={() => setShowAddDialog(false)}
            >
              Cancelar
            </button>
            <button
              className="terminal-btn-primary"
              style={{ flex: 1, padding: "6px" }}
              onClick={handleAddElemento}
            >
              <Icon name="plus" size={12} /> Adicionar
            </button>
          </div>
        </div>
      </div>

      {/* Right panel: Live preview canvas (simplified SVG preview) */}
      <div className="editor-etiqueta-preview">
        <h3>Prévia da Etiqueta {larguraMM}x{alturaMM}mm</h3>
        {template && template.elementos.length > 0 ? (
          <svg
            width={larguraMM * 3.78} // approximate px conversion at 96dpi
            height={alturaMM * 3.78}
            style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "4px" }}
            viewBox="0 0 {larguraMM} {alturaMM}"
          >
            {template.elementos.map((el, i) => {
              const { tipo, x, y, w, h, fonteMm, negrito, alinhamento, rotacao, textoFixo, colunaOrigem, prefixo } = el;
              // Calculate box position and size
              const pxX = x;
              const pxY = y;
              const pxW = w || 10;
              const pxH = h || 10;

              // Determine content
              let content = "";
              let contentStyle = "";

              if (tipo === TemplateType.TEXTO && textoFixo) {
                content = textoFixo;
                contentStyle = `font-size:${fonteMm}mm;${negrito ? "font-weight:bold;" : ""}text-align:${alinhamento || "esq"};`;
              } else if (tipo === TemplateType.CAMPO && colunaOrigem) {
                content = `{${colunaOrigem}}`;
                contentStyle = `font-size:${fonteMm}mm;${negrito ? "font-weight:bold;" : ""}text-align:${alinhamento || "esq"};border:1px dashed #64748b;padding:2px;`;
              } else if (tipo === TemplateType.QR_CODE) {
                content = "QRCODE";
                contentStyle = `font-size:${fonteMm}mm;text-align:center;background:#e8f0eb;`;
              } else if (tipo === TemplateType.CODIGO_BARRAS) {
                content = "BARRAS";
                contentStyle = `font-size:${fonteMm}mm;text-align:center;background:#e8f0eb;`;
              } else if (tipo === TemplateType.RANGE) {
                content = "FAIXA";
                contentStyle = `font-size:${fonteMm}mm;text-align:center;background:#e8f0eb;color:#22C55E;`;
              } else if (tipo === TemplateType.SERPENTINE) {
                content = "SERPENTINE";
                contentStyle = `font-size:${fonteMm}mm;text-align:center;background:#fbbf24;`;
              }

              return (
                <rect
                  key={i}
                  x={pxX}
                  y={pxY}
                  width={pxW || 20}
                  height={pxH || 10}
                  fill="var(--surface)"
                  stroke="var(--border)"
                  strokeWidth={0.5}
                />
                <text
                  x={pxX + 2}
                  y={pxY + (fonteMm || 3) * 0.4 + 5}
                  fill="#e8f0eb"
                  fontSize={fonteMm || 3}
                  style={negrito ? "font-weight:bold;" : ""}
                  textAnchor={alinhamento || "start"}
                >
                  {content}
                </text>
              );
            })}
          </svg>
        ) : (
          <div style={{ padding: "20px", color: "#64748b", textAlign: "center" }}>
            <p>Arraste elementos ou configure propriedades à esquerda.</p>
            <p style={{ margin: "16px 0" }}>Nenhum elemento adicionado ainda.</p>
            <p>Use o painel esquerdo para <strong>adicionar um elemento</strong>.</p>
          </div>
        )}
      </div>
    </div>
  );
}