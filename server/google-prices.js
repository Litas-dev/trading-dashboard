const fs = require('fs')
const path = require('path')

const OUT = path.join(__dirname, '..', 'public', 'prices.json')

const assets = [
  { key: 'SPY', url: 'https://www.google.com/finance/quote/SPY:NYSEARCA' },
  { key: 'QQQ', url: 'https://www.google.com/finance/quote/QQQ:NASDAQ' },
  { key: 'DIA', url: 'https://www.google.com/finance/quote/DIA:NYSEARCA' },
  { key: 'EWJ', url: 'https://www.google.com/finance/quote/EWJ:NYSEARCA' },
  { key: 'GLD', url: 'https://www.google.com/finance/quote/GLD:NYSEARCA' },
  { key: 'USO', url: 'https://www.google.com/finance/quote/USO:NYSEARCA' },
]

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache'
    }
  })
  if (!res.ok) throw new Error(`status ${res.status}`)
  return await res.text()
}

function parsePrice(html) {
  const m = html.match(/<div[^>]*class="[^"]*YMlKec[^"]*"[^>]*>([^<]+)<\/div>/)
  if (!m) return null
  const raw = m[1].trim()
  const num = raw.replace(/[^0-9.]/g, '')
  const val = parseFloat(num)
  return Number.isFinite(val) ? val : null
}

async function getGooglePrice(url) {
  try {
    const html = await fetchHtml(url)
    return parsePrice(html)
  } catch (e) {
    return null
  }
}

async function getBinance(symbol) {
  try {
    const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`)
    const j = await res.json()
    const val = parseFloat(j.price)
    return Number.isFinite(val) ? val : null
  } catch {
    return null
  }
}

async function getFx(base, sym) {
  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${base}`)
    const j = await res.json()
    const val = j?.rates?.[sym]
    return typeof val === 'number' ? val : null
  } catch {
    return null
  }
}

async function main() {
  const out = {}
  for (const a of assets) {
    out[a.key] = await getGooglePrice(a.url)
  }
  out.BTCUSDT = await getBinance('BTCUSDT')
  out.USDJPY = await getFx('USD', 'JPY')
  out.updated = Math.floor(Date.now() / 1000)
  fs.mkdirSync(path.dirname(OUT), { recursive: true })
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2))
  console.log('updated', OUT)
}

main()
