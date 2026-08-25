export function printBoxPdf(box, rowsToExport = []) {
  const win = window.open("", "_blank", "width=800,height=600");
  if (!win) {
    alert("Não foi possível abrir a janela de impressão.");
    return;
  }
  const tableRows = rowsToExport
    .map(
      (row) => `
        <tr>
          <td>${row.Item ?? ""}</td>
          <td>${row.Codigo ?? ""}</td>
          <td>${row.Descricao ?? ""}</td>
          <td>${row.Data ?? ""} ${row.Hora ?? ""}</td>
        </tr>`
    )
    .join("");

  win.document.write(`
    <html>
      <head>
        <title>CAIXA ${box.number}</title>
        <style>
          body { font-family: 'Segoe UI', sans-serif; padding: 24px; color: #111827; }
          h1 { font-size: 20px; margin-bottom: 4px; }
          p { color: #64748b; font-size: 13px; margin-top: 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
          th, td { border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; }
          th { background: #f1f5f9; }
        </style>
      </head>
      <body>
        <h1>CAIXA ${box.number}</h1>
        <p>${box.description || "Sem descrição"} — ${rowsToExport.length} item(ns)</p>
        <table>
          <thead>
            <tr><th>Item</th><th>Código</th><th>Descrição</th><th>Data/Hora</th></tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
      </body>
    </html>
  `);
  win.document.close();
  win.focus();
  win.print();
}
