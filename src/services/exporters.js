// Export helpers: CSV download and PDF via the browser's print pipeline.
import { toCsv } from './domain.js'

export function downloadCsv(filename, rows) {
  const csv = Array.isArray(rows) ? toCsv(rows) : rows
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

const esc = (s) =>
  String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

/**
 * Renders rows into a print-ready document and opens the print dialog, where
 * the user picks "Save as PDF".
 *
 * This is deliberate: producing a real PDF byte stream in-browser needs a
 * library (jsPDF/pdfmake) and would not embed the Khmer font, so Khmer text
 * would render as boxes. The print pipeline uses the page's own webfonts and
 * therefore prints ខ្មែរ correctly.
 */
export function exportPdf({ title, subtitle, columns, rows, brand = 'VKS' }) {
  const win = window.open('', '_blank', 'width=1024,height=768')
  if (!win) return false

  const head = columns.map((c) => `<th>${esc(c.label)}</th>`).join('')
  const body = rows
    .map((r) => `<tr>${columns.map((c) => `<td class="${c.align || ''}">${esc(c.format ? c.format(r[c.key], r) : r[c.key])}</td>`).join('')}</tr>`)
    .join('')

  win.document.write(`<!doctype html><html><head><meta charset="utf-8" />
<title>${esc(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@600;800&family=Plus+Jakarta+Sans:wght@400;600&family=Noto+Sans+Khmer:wght@400;600&display=swap" rel="stylesheet" />
<style>
  *{box-sizing:border-box}
  body{font-family:"Plus Jakarta Sans","Noto Sans Khmer",sans-serif;color:#0f1115;margin:32px;font-size:12px}
  header{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid #0f1115;padding-bottom:12px;margin-bottom:18px}
  h1{font-family:"Outfit",sans-serif;font-size:22px;margin:0;letter-spacing:.14em;font-weight:800}
  .meta{text-align:right;color:#6b7280;font-size:11px;line-height:1.5}
  h2{font-family:"Outfit",sans-serif;font-size:15px;margin:0 0 2px}
  table{width:100%;border-collapse:collapse}
  th{background:#f1f2f4;text-align:left;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#6b7280;padding:8px;border-radius:0}
  td{padding:8px;border-bottom:1px solid #e4e6ea}
  td.right,th.right{text-align:right}
  tbody tr:nth-child(even){background:#fafafb}
  footer{margin-top:18px;color:#6b7280;font-size:10px;text-align:center}
  @page{margin:14mm}
</style></head><body>
<header>
  <div><h1>${esc(brand)}</h1><h2>${esc(title)}</h2>${subtitle ? `<div class="meta" style="text-align:left">${esc(subtitle)}</div>` : ''}</div>
  <div class="meta">Generated<br/><strong>${new Date().toLocaleString()}</strong><br/>${rows.length} rows</div>
</header>
<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>
<footer>${esc(brand)} — generated report</footer>
</body></html>`)
  win.document.close()
  win.focus()
  setTimeout(() => win.print(), 400)
  return true
}
