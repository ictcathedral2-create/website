// Exports an array of records to a downloadable CSV file (opens directly in Excel).
export function downloadCsv(filename, columns, rows) {
  const escapeCell = value => {
    const str = value === null || value === undefined ? "" : String(value);
    if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
    return str;
  };

  const header = columns.map(c => escapeCell(c.label)).join(",");
  // Prefer a column's plain-text `csv` value; a `render` that returns JSX
  // (images, links) falls back to the raw stored value.
  const cellValue = (c, row) => {
    if (c.csv) return c.csv(row[c.key], row);
    if (c.render) {
      const rendered = c.render(row[c.key], row);
      if (rendered === null || typeof rendered !== "object") return rendered;
    }
    return row[c.key];
  };
  const lines = rows.map(row => columns.map(c => escapeCell(cellValue(c, row))).join(","));
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
