export default function ColorOption({ color, selected, onSelect, label }) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(color)}
      title={label || color}
      aria-label={label || color}
      style={{
        width: 32,
        height: 32,
        borderRadius: "50%",
        border: selected ? "3px solid #fff" : "1px solid var(--border-strong)",
        boxShadow: selected ? `0 0 0 3px ${color}` : "none",
        background: color,
        cursor: "pointer",
        transition: "box-shadow 150ms ease"
      }}
    />
  );
}
