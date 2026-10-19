// Real KHQR (Bakong / EMVCo Merchant Presented QR) payload builder.
// Spec: EMV QRCPS + NBC Bakong KHQR. Produces the exact string that Cambodian
// banking apps (ABA, Wing, ACLEDA, Bakong…) decode when scanning.

const tag = (id, value) => `${id}${String(value).length.toString().padStart(2, '0')}${value}`

/** CRC-16/CCITT-FALSE — required by EMVCo tag 63. */
export function crc16(str) {
  let crc = 0xffff
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

const CURRENCY = { USD: '840', KHR: '116' }

/**
 * @param {object} o
 * @param {string} o.bakongAccount  e.g. "vks_store@wing"
 * @param {string} o.merchantName   max 25 chars
 * @param {string} o.merchantCity   max 15 chars
 * @param {number} o.amount         major units (e.g. 189.00)
 * @param {string} o.currency       'USD' | 'KHR'
 * @param {string} [o.billNumber]   order reference
 */
export function buildKhqr({
  bakongAccount,
  merchantName = 'VKS SNEAKERS',
  merchantCity = 'PHNOM PENH',
  amount,
  currency = 'USD',
  billNumber,
}) {
  const dynamic = Number(amount) > 0
  const merchantInfo = tag('00', 'kh.gov.nbc.bakong') + tag('01', bakongAccount)

  let payload =
    tag('00', '01') +
    tag('01', dynamic ? '12' : '11') +
    // Tag 29 = individual merchant account (Bakong)
    tag('29', merchantInfo) +
    tag('52', '5661') + // MCC 5661 — Shoe Stores
    tag('53', CURRENCY[currency] || CURRENCY.USD)

  if (dynamic) {
    const amt = currency === 'KHR' ? String(Math.round(amount)) : Number(amount).toFixed(2)
    payload += tag('54', amt)
  }

  payload +=
    tag('58', 'KH') +
    tag('59', String(merchantName).slice(0, 25)) +
    tag('60', String(merchantCity).slice(0, 15))

  if (billNumber) payload += tag('62', tag('01', String(billNumber).slice(0, 25)))

  // CRC is computed over the payload including the "6304" header itself.
  payload += '6304'
  return payload + crc16(payload)
}

/** Decodes a KHQR string back into tags — used to verify what we generated. */
export function parseEmv(payload) {
  const out = {}
  let i = 0
  while (i < payload.length - 4) {
    const id = payload.slice(i, i + 2)
    const len = parseInt(payload.slice(i + 2, i + 4), 10)
    if (Number.isNaN(len)) break
    out[id] = payload.slice(i + 4, i + 4 + len)
    i += 4 + len
  }
  return out
}
