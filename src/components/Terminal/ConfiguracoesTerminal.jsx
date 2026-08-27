import React, { useState, useEffect, useRef, useCallback } from "react";
import Icon from "./../../../src/components/ui/Icon.jsx";
import { getTemplates, saveTemplate, getActiveTemplateId, setActiveTemplate, getActiveTemplate, TemplateType, DefaultDimensions } from "../../../src/services/labelTemplateService.js";

const CONFIRM_DELETE = "Deseja realmente excluir este modelo?";
const CONFIRM_OVERWRITE = "Já existe um modelo com este nome. Deseja substituí-lo?";

export default function ConfiguracoesTerminal() {
  const [templates, setTemplates] = useState([]);
  const [activeTemplateId, setActiveTemplateId] = useState(null);
  const [activeTemplate, setActiveTemplate] = useState(null);
  const [editingTemplateId, setEditingTemplateId] = useState(null);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [showNewTemplateDialog, setShowNewTemplateDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedTemplateForDelete, setSelectedTemplateForDelete] = useState(null);

  // Sistema info
  const [versaoModulo, setVersaoModulo] = useState("1.0.0");
  const [storageTipo, setStorageTipo] = useState("IndexedDB (navegador)");
  const [dbStatus, setDbStatus] = useState("");

  // Load templates on mount
  useEffect(() => {
    carregarTemplates();
    verificarIndexedDB();
  }, []);

  async function carregarTemplates() {
    const all = await getTemplates();
    setTemplates(all);
    // Set active if not already
    if (!activeTemplateId && all.length > 0) {
      const firstId = all[0].id;
      setActiveTemplateId(firstId);
      await setActiveTemplateId(firstId);
    }
  }

  async function verificarIndexedDB() {
    try {
      const id = await getActiveTemplateId();
      setDbStatus(`IDB OK - template ativo: ${id || "nenhum"}`);
    } catch (e) {
      setDbStatus("Modo fallback localStorage");
    }
  }

  async function carregarTemplate(id) {
    const template = await getTemplate(id);
    if (template) {
      setActiveTemplate(template);
      setActiveTemplateId(template.id);
    }
  }

  // CRUD handlers
  async function handleNovoTemplate() {
    setNewTemplateName("");
    setShowNewTemplateDialog(true);
  }

  async function handleSalvarNovoTemplate() {
    if (!newTemplateName.trim()) return;
    const existing = templates.find((t) => t.nome === newTemplateName && t.id !== activeTemplateId);
    if (existing && editingTemplateId) {
      // Editando existente
      await updateTemplateEdicionado(editingTemplateName, newTemplateName);
    } else if (existing) {
      setShowDeleteConfirm(true);
    } else {
      const novo = {
        id: Date.now().toString(),
        nome: newTemplateName,
        ativo: false,
        dimensoes: { ...DefaultDimensions },
        elementos: []
      };
      await saveTemplate(novo);
      setTemplates((prev) => [...prev, novo]);
      setNewTemplateName("");
      setShowNewTemplateDialog(false);
      // Set as active
      await setActiveTemplateId(novo.id);
    }
  }

  async function updateTemplateEdicionado(antigoNome, novoNome) {
    // Find and update
    setTemplates((prev) =>
      prev.map((t) => (t.nome === antigoNome ? { ...t, nome: novoNome } : t))
    );
    // If we're editing the active template, update active too
    if (activeTemplate?.nome === antigoNome) {
      await updateTemplate(activeTemplate.id, { ...activeTemplate, nome: novoNome });
    }
    setShowNewTemplateDialog(false);
    setEditingTemplateId(null);
    setEditingTemplateName(null);
  }

  async function handleEditarTemplate(tpl) {
    // Check if name is already used by another template
    const jaExiste = templates.some((t) => t.nome === tpl.nome && t.id !== tpl.id);
    if (jaExiste) {
      // Show conflict - ask user or auto-prefix
      // For simplicity, we'll just proceed and let the system handle it
      // by updating the name with a suffix
      const indice = templates.findIndex((t) => t.id === tpl.id);
      if (indice >= 0) {
        const novoNome = `${tpl.nome} (${templates.indexOf(tpl) + 1})`;
        setTemplates((prev) =>
          prev.map((t, i) => (i === indice ? { ...t, nome: novoNome } : t))
        );
        await updateTemplate(tpl.id, { ...tpl, nome: novoNome });
      }
    } else {
      await updateTemplate(tpl.id, { ...tpl });
    }
    setShowNewTemplateDialog(false);
  }

  async function handleExcluirTemplate(tpl) {
    setSelectedTemplateForDelete(tpl);
    setShowDeleteConfirm(true);
  }

  async function confirmarExclusao() {
    if (!selectedTemplateForDelete) return;
    await deleteTemplate(selectedTemplateForDelete.id);
    setTemplates((prev) => prev.filter((t) => t.id !== selectedTemplateForDelete.id));
    if (activeTemplateId === selectedTemplateForDelete.id) {
      setActiveTemplateId(null);
      setActiveTemplate(null);
    }
    setShowDeleteConfirm(false);
    setSelectedTemplateForDelete(null);
  }

  // Import/Export handlers
  async function handleExportarTemplate() {
    // Export current active template as JSON
    const tpl = activeTemplate;
    if (!tpl) {
      alert("Nenhum modelo ativo para exportar.");
      return;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tpl));
    const downloadNode = document.createElement("a");
    downloadNode.setAttribute("href", dataStr);
    downloadNode.setAttribute("download", `${tpl.nome}_${new Date().toISOString().split("T")[0]}.json`);
    downloadNode.click();
  }

  async function handleImportarTemplate() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const imported = JSON.parse(e.target.result);
          // Validate minimum fields
          if (!imported.nome || !imported.elementos) {
            alert("Arquivo de modelo inválido: campos nome e elementos são obrigatórios.");
            return;
          }
          // Check for name conflict
          const exists = templates.some((t) => t.nome === imported.nome);
          if (exists) {
            if (window.confirm(`Já existe um modelo "${imported.nome}". Importar de qualquer forma?`)) {
              // Remove existing with same name
              await deleteTemplateByName(imported.nome);
            } else {
              return;
            }
          }
          await saveTemplate(imported);
          setTemplates((prev) => [...prev, imported]);
          // Set as active if no active template
          if (!activeTemplateId) {
            await setActiveTemplateId(imported.id);
          }
        } catch (err) {
          alert("Erro ao ler arquivo JSON: " + err.message);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  async function deleteTemplateByName(nome) {
    const toDelete = templates.find((t) => t.nome === nome);
    if (toDelete) {
      await deleteTemplate(toDelete.id);
      setTemplates((prev) => prev.filter((t) => t.id !== toDelete.id));
    }
  }

  // Update active template when selection changes
  useEffect(() => {
    if (activeTemplateId) {
      carregarTemplate(activeTemplateId).then(() => {
        setDbStatus(`IDB OK - template ativo: ${activeTemplateId}`);
      });
    }
  }, [activeTemplateId]);

  // UI
  const templateCards = templates.map((tpl) => (
    <div
      key={tpl.id}
      className="terminal-config-card"
      style={{
        border: activeTemplateId === tpl.id ? "2px solid #22C55E" : "1px solid var(--border)",
        background: activeTemplateId === tpl.id ? "rgba(34, 197, 94, 0.1)" : "var(--surface)",
      }}
    >
      <div className="terminal-config-header">
        <span>{tpl.nome}</span>
        <span className="terminal-config-status"
          style={activeTemplateId === tpl.id ? { color: "#22C55E" } : { color: "#94a3b8" }}
        >
          {(activeTemplateId === tpl.id ? "ATIVO" : "")}
        </span>
      </div>
      <div className="terminal-config-details">
        <span>Elem: {tpl.elementos?.length || 0}</span>
        <span style={{ marginLeft: "auto" }}>• {tpl.dimensoes?.largura}x{tpl.dimensoes?.altura}mm</span>
      </div>
      <button
        className="terminal-config-btn"
        onClick={() => setActiveTemplateId(tpl.id)}
        title="Definir como ativo"
      >
        <Icon name="check" size={12} /> Definir
      </button>
      <button
        className="terminal-config-btn secundario"
        onClick={() => handleExcluirTemplate(tpl)}
        title="Excluir"
        style={{ marginLeft: "4px" }}
      >
        <Icon name="trash" size={12} /> Excluir
      </button>
    </div>
  ));

  return (
    <div className="terminal-config-shell">
      <div className="terminal-panel-esquerdo">
        <h2>Modelos de Etiqueta</h2>
        {templates.length === 0
          ? <p style={{ color: "#64748b", margin: "16px 0" }}>Nenhum modelo cadastrado. Clique em <strong>+ Novo</strong> para criar seu primeiro modelo.</p>
          : templateCards}
        <div className="terminal-add-new">
          <button className="terminal-btn-add" onClick={handleNovoTemplate}>
            <Icon name="plus" size={16} /> + Novo
          </button>
        </div>

        {/* Novo modelo dialog */}
        {showNewTemplateDialog && (
          <div className="terminal-dialog-overlay">
            <div className="terminal-dialog-box">
              <h3>{editingTemplateId ? "Editar Modelo" : "Novo Modelo"}</h3>
              <p>Nome do modelo:</p>
              <input
                type="text"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                readOnly={editingTemplateId ? true : false}
                style={{ width: "100%", padding: "8px", margin: "8px 0", borderRadius: "6px" }}
              />
              {editingTemplateId && (
                <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "16px" }}>
                  Nome já existente. Será acrescentado número sequencial.
                </p>
              )}
              <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
                <button
                  className="terminal-dialog-btn"
                  onClick={() => setShowNewTemplateDialog(false)}
                  style={{ flex: 1 }}
                >
                  Cancelar
                </button>
                <button
                  className="terminal-dialog-btn primario"
                  onClick={handleSalvarNovoTemplate}
                  style={{ flex: 1 }}
                >
                  {editingTemplateId ? "Salvar Alterações" : "Salvar Modelo"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete confirm dialog */}
        {showDeleteConfirm && selectedTemplateForDelete && (
          <div className="terminal-dialog-overlay">
            <div className="terminal-dialog-box">
              <h3>Confirmar Exclusão</h3>
              <p>{CONFIRM_DELETE}</p>
              <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
                <button
                  className="terminal-dialog-btn"
                  onClick={() => setShowDeleteConfirm(false)}
                  style={{ flex: 1 }}
                >
                  Cancelar
                </button>
                <button
                  className="terminal-dialog-btn perigo"
                  onClick={confirmarExclusao}
                  style={{ flex: 1 }}
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sistema info */}
        <div className="terminal-sistema-info" style={{ marginTop: "24px", padding: "12px", borderRadius: "8px", background: "var(--surface)", border: "1px solid var(--border)" }}>
          <h4 style={{ margin: "0 0 8px 0", fontSize: "12px", textTransform: "uppercase", color: "#64748b" }}>Sistema</h4>
          <p style={{ fontSize: "12px", margin: "4px 0" }}>Versão Módulo: {versaoModulo}</p>
          <p style={{ fontSize: "12px", margin: "4px 0" }}>Armazenamento: {storageTipo}</p>
          <p style={{ fontSize: "12px", margin: "4px 0" }}>{dbStatus}</p>
        </div>
      </div>

      <div className="terminal-panel-direito">
        {activeTemplate ? (
          <div>
            <h2>Prévia do Modelo: {activeTemplate.nome}</h2>
            <p style={{ fontSize: "12px", color: "#64748b", margin: "8px 0" }}>
              Dimensões: {activeTemplate.dimensoes?.largura}x{activeTemplate.dimensoes?.altura}mm
            </p>
            {/* Simple preview: show element count and types */}
            <div style={{ background: "var(--surface)", padding: "16px", borderRadius: "8px", marginTop: "16px" }}>
              <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 8px 0" }}>Elementos ({activeTemplate.elementos?.length || 0}):</p>
              {activeTemplate.elementos?.map((el, i) => (
                <span key={i} style={{ display: "inline-block", margin: "2px 4px", fontSize: "11px", color: "#94a3b8" }}>
                  {el.tipo}: {el.textoFixo || el.colunaOrigem || "campo"}
                </span>
              ))}
            </div>
            <button
              className="terminal-btn-primary"
              onClick={() => window.open(`/terminal/etiqueta/${activeTemplate.id}`, "_blank")}
              style={{ width: "100%", padding: "10px" }}
            >
              <Icon name="download" size={16} /> Abrir Editor
            </button>
          </div>
        ) : (
          <div style={{ padding: "20px", color: "#64748b", textAlign: "center" }}>
            <p>Selecione um modelo à esquerda para ver a pré-visualização.</p>
            <p style={{ margin: "16px 0", fontSize: "12px" }}>Nem mesmo modelos padrão foram criados ainda.</p>
            <p>Use <strong>+ Novo</strong> para criar seu primeiro modelo de etiqueta.</p>
          </div>
        )}
      </div>
    </div>
  );
}