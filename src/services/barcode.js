// Code 39 barcode encoder — a real, scannable symbology (ISO/IEC 16388).
// Returns bar widths so the receipt can render crisp SVG rectangles.

const PATTERNS = {
  '0': 'nnnwwnwnn', '1': 'wnnwnnnnw', '2': 'nnwwnnnnw', '3': 'wnwwnnnnn', '4': 'nnnwwnnnw',
  '5': 'wnnwwnnnn', '6': 'nnwwwnnnn', '7': 'nnnwnnwnw', '8': 'wnnwnnwnn', '9': 'nnwwnnwnn',
  A: 'wnnnnwnnw', B: 'nnwnnwnnw', C: 'wnwnnwnnn', D: 'nnnnwwnnw', E: 'wnnnwwnnn',
  F: 'nnwnwwnnn', G: 'nnnnnwwnw', H: 'wnnnnwwnn', I: 'nnwnnwwnn', J: 'nnnnwwwnn',
  K: 'wnnnnnnww', L: 'nnwnnnnww', M: 'wnwnnnnwn', N: 'nnnnwnnww', O: 'wnnnwnnwn',
  P: 'nnwnwnnwn', Q: 'nnnnnnwww', R: 'wnnnnnwwn', S: 'nnwnnnwwn', T: 'nnnnwnwwn',
  U: 'wwnnnnnnw', V: 'nwwnnnnnw', W: 'wwwnnnnnn', X: 'nwnnwnnnw', Y: 'wwnnwnnnn',
  Z: 'nwwnwnnnn', '-': 'nwnnnnwnw', '.': 'wwnnnnwnn', ' ': 'nwwnnnwnn',
  $: 'nwnwnwnnn', '/': 'nwnwnnnwn', '+': 'nwnnnwnwn', '%': 'nnnwnwnwn', '*': 'nwnnwnwnn',
}

const NARROW = 1
const WIDE = 3

/**
 * @param {string} text
 * @returns {{bars: {x:number,w:number}[], width:number, value:string}}
 */
export function code39(text) {
  const value = String(text).toUpperCase().replace(/[^0-9A-Z\-. $/+%]/g, '')
  const chars = `*${value}*`.split('')

  const bars = []
  let x = 0
  chars.forEach((ch, idx) => {
    const pattern = PATTERNS[ch] || PATTERNS['-']
    for (let i = 0; i < pattern.length; i++) {
      const w = pattern[i] === 'w' ? WIDE : NARROW
      // Even indices are bars, odd are spaces.
      if (i % 2 === 0) bars.push({ x, w })
      x += w
    }
    if (idx < chars.length - 1) x += NARROW // inter-character gap
  })

  return { bars, width: x, value }
}
