/**
 * csv — tiny CSV serialization helpers shared by every export builder.
 *
 * Rule (QA-FIX-A): every CSV export in the Principal workspace serializes
 * through here so fields containing commas, quotes or newlines are always
 * escaped with RFC-4180 double-quote wrapping, and numeric cells are plain
 * numbers (no currency symbols, no thousands separators).
 */

/** Escape a single CSV cell (RFC-4180: wrap in quotes when needed). */
export function csvEscape(cell: string | number): string {
  const s = String(cell)
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

/** Serialize one row of cells into a comma-separated line. */
export function toCsvRow(cells: (string | number)[]): string {
  return cells.map(csvEscape).join(',')
}

/** Serialize a header row + data rows into a full CSV document. */
export function toCsv(header: (string | number)[], rows: (string | number)[][]): string {
  return [toCsvRow(header), ...rows.map(toCsvRow)].join('\n')
}
