import StepBadge from "./StepBadge.jsx";

export default function Panel({ step, title, description, active = true, trailing, children }) {
  return (
    <section
      className="panel-surface"
      style={{
        maxWidth: 1200,
        margin: "0 auto 24px",
        background: "var(--surface)",
        border: `1px solid ${active ? "var(--border)" : "var(--border)"}`,
        opacity: active ? 1 : 0.6,
        transition: "opacity 180ms ease"
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "20px 24px",
          borderBottom: "1px solid var(--border)",
          flexWrap: "wrap"
        }}
      >
        {step != null && <StepBadge step={step} />}
        <div style={{ minWidth: 0, flex: 1 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--text)", margin: 0 }}>
            {title}
          </h2>
          {description && (
            <p style={{ fontSize: 13, color: "var(--muted)", margin: "2px 0 0" }}>
              {description}
            </p>
          )}
        </div>
        {trailing && (
          <div
            className="panel-actions"
            style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}
          >
            {trailing}
          </div>
        )}
      </header>
      <div style={{ padding: "20px 24px" }}>{children}</div>
    </section>
  );
}
