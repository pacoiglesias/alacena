// PDF text items arrive as separate cells; rebuild rows before parsing a ticket.
export function pdfTextLines(items = []) {
  const rows = [];
  for (const item of items) {
    if (!item.str?.trim() || !item.transform) continue;
    const x = item.transform[4], y = item.transform[5];
    let row = rows.find((r) => Math.abs(r.y - y) < 3);
    if (!row) { row = { y, cells: [] }; rows.push(row); }
    row.cells.push({ x, text: item.str });
  }
  return rows.sort((a, b) => b.y - a.y).map((r) => r.cells.sort((a, b) => a.x - b.x).map((c) => c.text).join('  ')).join('\n');
}
