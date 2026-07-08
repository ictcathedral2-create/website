// Exports an array of records to a downloadable CSV file (opens directly in Excel).
export function downloadCsv(filename, columns, rows) {
  const escapeCell = value => {
    const str = value === null || value === undefined ? "" : String(value);
    if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
    return str;
  };

  const header = columns.map(c => escapeCell(c.label)).join(",");
  const lines = rows.map(row =>
    columns.map(c => escapeCell(c.render ? c.render(row[c.key], row) : row[c.key])).join(",")
  );
  const csv = [header, ...lines].join("\r\n");

  // Prefix with a UTF-8 BOM so Excel reads accented characters correctly.
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
