export default function ItensSelecionados({ items = [] }) {
  if (!items.length) return null;
  return (
    <div className="items-table-wrap">
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr>
            {Object.keys(items[0]).map((header) => (
              <th key={header} style={{ textAlign: "left", padding: "8px 10px", borderBottom: "2px solid #22C55E", color: "var(--text)", whiteSpace: "nowrap" }}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={index}>
              {Object.keys(items[0]).map((key) => (
                <td key={key} style={{ padding: "7px 10px", borderBottom: "1px solid var(--border)", color: "var(--text)", whiteSpace: "nowrap" }}>{String(item[key] ?? "")}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
