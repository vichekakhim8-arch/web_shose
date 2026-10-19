const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
const dateFmt = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' })
const dateTimeFmt = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' })

export const formatPrice = (cents) => usd.format((cents || 0) / 100)
export const formatDate = (iso) => (iso ? dateFmt.format(new Date(iso)) : '')
export const formatDateTime = (iso) => (iso ? dateTimeFmt.format(new Date(iso)) : '')
export const shortId = (id) => String(id || '').toUpperCase()

export const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  paid: 'bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300',
  packed: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/15 dark:text-indigo-300',
  shipped: 'bg-violet-100 text-violet-800 dark:bg-violet-500/15 dark:text-violet-300',
  delivered: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
  cancelled: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
}

export function downloadCsv(filename, csv) {
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function useFormat() {
  return { formatPrice, formatDate, formatDateTime, shortId, STATUS_STYLES, downloadCsv }
}
