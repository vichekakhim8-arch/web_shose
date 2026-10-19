// Date-range presets for dashboard filters. All resolvers return {from, to}
// as inclusive Date boundaries (local time).

const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x }
const endOfDay = (d) => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x }
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }
const addMonths = (d, n) => { const x = new Date(d); x.setMonth(x.getMonth() + n); return x }

/** Week starts Monday (common in KH business reporting). */
function startOfWeek(d) {
  const x = startOfDay(d)
  const day = (x.getDay() + 6) % 7
  return addDays(x, -day)
}
const startOfMonth = (d) => startOfDay(new Date(d.getFullYear(), d.getMonth(), 1))
const endOfMonth = (d) => endOfDay(new Date(d.getFullYear(), d.getMonth() + 1, 0))
const startOfQuarter = (d) => startOfDay(new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3, 1))
const endOfQuarter = (d) => endOfDay(new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3 + 3, 0))
const startOfYear = (d) => startOfDay(new Date(d.getFullYear(), 0, 1))
const endOfYear = (d) => endOfDay(new Date(d.getFullYear(), 11, 31))

export const RANGE_PRESETS = [
  { id: 'today', key: 'range.today', group: 'day' },
  { id: 'yesterday', key: 'range.yesterday', group: 'day' },
  { id: 'tomorrow', key: 'range.tomorrow', group: 'day' },
  { id: 'thisWeek', key: 'range.thisWeek', group: 'week' },
  { id: 'lastWeek', key: 'range.lastWeek', group: 'week' },
  { id: 'wtd', key: 'range.wtd', group: 'week' },
  { id: 'thisMonth', key: 'range.thisMonth', group: 'month' },
  { id: 'lastMonth', key: 'range.lastMonth', group: 'month' },
  { id: 'mtd', key: 'range.mtd', group: 'month' },
  { id: 'thisQuarter', key: 'range.thisQuarter', group: 'quarter' },
  { id: 'lastQuarter', key: 'range.lastQuarter', group: 'quarter' },
  { id: 'thisYear', key: 'range.thisYear', group: 'year' },
  { id: 'lastYear', key: 'range.lastYear', group: 'year' },
  { id: 'ytd', key: 'range.ytd', group: 'year' },
  { id: 'last7', key: 'range.last7', group: 'rolling' },
  { id: 'last14', key: 'range.last14', group: 'rolling' },
  { id: 'last30', key: 'range.last30', group: 'rolling' },
  { id: 'last60', key: 'range.last60', group: 'rolling' },
  { id: 'last90', key: 'range.last90', group: 'rolling' },
  { id: 'custom', key: 'range.custom', group: 'custom' },
]

export function resolveRange(id, custom = {}) {
  const now = new Date()
  switch (id) {
    case 'today': return { from: startOfDay(now), to: endOfDay(now) }
    case 'yesterday': return { from: startOfDay(addDays(now, -1)), to: endOfDay(addDays(now, -1)) }
    case 'tomorrow': return { from: startOfDay(addDays(now, 1)), to: endOfDay(addDays(now, 1)) }
    case 'thisWeek': return { from: startOfWeek(now), to: endOfDay(addDays(startOfWeek(now), 6)) }
    case 'lastWeek': {
      const s = addDays(startOfWeek(now), -7)
      return { from: s, to: endOfDay(addDays(s, 6)) }
    }
    case 'wtd': return { from: startOfWeek(now), to: endOfDay(now) }
    case 'thisMonth': return { from: startOfMonth(now), to: endOfMonth(now) }
    case 'lastMonth': {
      const p = addMonths(now, -1)
      return { from: startOfMonth(p), to: endOfMonth(p) }
    }
    case 'mtd': return { from: startOfMonth(now), to: endOfDay(now) }
    case 'thisQuarter': return { from: startOfQuarter(now), to: endOfQuarter(now) }
    case 'lastQuarter': {
      const p = addMonths(now, -3)
      return { from: startOfQuarter(p), to: endOfQuarter(p) }
    }
    case 'thisYear': return { from: startOfYear(now), to: endOfYear(now) }
    case 'lastYear': {
      const p = new Date(now.getFullYear() - 1, 5, 1)
      return { from: startOfYear(p), to: endOfYear(p) }
    }
    case 'ytd': return { from: startOfYear(now), to: endOfDay(now) }
    case 'last7': return { from: startOfDay(addDays(now, -6)), to: endOfDay(now) }
    case 'last14': return { from: startOfDay(addDays(now, -13)), to: endOfDay(now) }
    case 'last30': return { from: startOfDay(addDays(now, -29)), to: endOfDay(now) }
    case 'last60': return { from: startOfDay(addDays(now, -59)), to: endOfDay(now) }
    case 'last90': return { from: startOfDay(addDays(now, -89)), to: endOfDay(now) }
    case 'custom': {
      const f = custom.from ? startOfDay(new Date(custom.from)) : startOfDay(addDays(now, -29))
      const t = custom.to ? endOfDay(new Date(custom.to)) : endOfDay(now)
      return { from: f, to: t }
    }
    default: return { from: startOfDay(addDays(now, -13)), to: endOfDay(now) }
  }
}

/** Inclusive list of yyyy-mm-dd keys, capped so charts stay readable. */
export function eachDay(from, to, cap = 180) {
  const out = []
  let cur = startOfDay(from)
  const end = startOfDay(to)
  while (cur <= end && out.length < cap) {
    out.push(cur.toISOString().slice(0, 10))
    cur = addDays(cur, 1)
  }
  return out
}

export const iso = (d) => new Date(d).toISOString().slice(0, 10)
