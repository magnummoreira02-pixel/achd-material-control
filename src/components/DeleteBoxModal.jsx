import Icon from "./ui/Icon.jsx";

export default function DeleteBoxModal({ candidate, onCancel, onConfirm }) {
  if (!candidate) return null;

  const materialCount = (candidate.materials || []).length;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel?.();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.7)",
        display: "grid",
        placeItems: "center",
        zIndex: 1000,
        padding: 20
      }}
    >
      <div
        style={{
          width: "min(460px, 100%)",
          background: "#1F2937",
          border: "1px solid rgba(239, 68, 68, 0.35)",
          borderRadius: 20,
          padding: 24,
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.6)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <span style={{ display: "grid", placeItems: "center", width: 44, height: 44, borderRadius: 12, background: "rgba(239, 68, 68, 0.14)" }}>
            <Icon name="trash" size={22} color="#EF4444" />
          </span>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#E8F0EB", margin: 0 }}>Excluir caixa</h2>
            <p style={{ fontSize: 13, color: "#94a3b8", margin: "2px 0 0" }}>CAIXA {candidate.number}</p>
          </div>
        </div>

        <div style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(234, 179, 8, 0.10)", border: "1px solid rgba(234, 179, 8, 0.3)", marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", color: "#EAB308", marginBottom: 6 }}>ATENÇÃO</div>
          <p style={{ fontSize: 13, color: "#E8F0EB", margin: 0, lineHeight: 1.5 }}>
            Esta ação é permanente e não pode ser desfeita.
            {materialCount > 0 && ` Os ${materialCount} material(is) desta caixa também serão removidos do histórico de leituras.`}
          </p>
        </div>

        {candidate.description && (
          <p style={{ fontSize: 13, color: "#94a3b8", margin: "0 0 16px" }}>{candidate.description}</p>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              flex: 1,
              padding: "12px 16px",
              background: "transparent",
              border: "1px solid #334155",
              borderRadius: 12,
              color: "#E8F0EB",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 13
            }}
          >
            CANCELAR
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: "12px 16px",
              background: "#EF4444",
              border: "none",
              borderRadius: 12,
              color: "#fff",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 13
            }}
          >
            EXCLUIR
          </button>
        </div>
      </div>
    </div>
  );
}
