export default function StepBadge({ step = 1 }) {
  return (
    <span
      className="step-badge"
      style={{
        width: 28,
        height: 28,
        display: "inline-grid",
        placeItems: "center",
        borderRadius: "50%",
        background: "#22C55E",
        color: "#FFFFFF",
        fontSize: 13,
        fontWeight: 700,
        flexShrink: 0
      }}
    >
      {step}
    </span>
  );
}
