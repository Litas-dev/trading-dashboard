const fs = require('fs')
const path = require('path')
const puppeteer = require('puppeteer-core')

const OUT = path.join(__dirname, '..', 'public', 'prices.json')

const assets = [
  { key: 'SPY', url: 'https://www.google.com/finance/quote/SPY:NYSEARCA' },
  { key: 'QQQ', url: 'https://www.google.com/finance/quote/QQQ:NASDAQ' },
  { key: 'DIA', url: 'https://www.google.com/finance/quote/DIA:NYSEARCA' },
  { key: 'EWJ', url: 'https://www.google.com/finance/quote/EWJ:NYSEARCA' },
  { key: 'GLD', url: 'https://www.google.com/finance/quote/GLD:NYSEARCA' },
  { key: 'USO', url: 'https://www.google.com/finance/quote/USO:NYSEARCA' },
]

function chromePath() {
  const candidates = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/opt/homebrew/bin/chromium'
  ]
  for (const p of candidates) {
    try { if (fs.existsSync(p)) return p } catch {}
  }
  return null
}

async function main() {
  const exe = chromePath()
  if (!exe) {
    console.error('Chrome/Chromium not found')
    process.exit(1)
  }
  const browser = await puppeteer.launch({
    executablePath: exe,
    headless: 'new',
    args: ['--no-sandbox','--disable-dev-shm-usage']
  })
  const page = await browser.newPage()
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36')
  await page.setExtraHTTPHeaders({'Accept-Language': 'en-US,en;q=0.9'})
  const out = {}
  for (const a of assets) {
    try {
      await page.goto(a.url, { waitUntil: 'networkidle2', timeout: 30000 })
      await page.waitForSelector('.YMlKec', { timeout: 15000 })
      const raw = await page.$eval('.YMlKec', el => el.textContent)
      const num = parseFloat(String(raw).replace(/[^0-9.]/g, ''))
      out[a.key] = Number.isFinite(num) ? num : null
    } catch {
      out[a.key] = null
    }
  }
  // BTC and FX
  try {
    const res = await page.evaluate(async () => {
      const b = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT')
      const j = await b.json()
      return j.price
    })
    const val = parseFloat(res)
    out.BTCUSDT = Number.isFinite(val) ? val : null
  } catch { out.BTCUSDT = null }
  try {
    const r = await page.evaluate(async () => {
      const fx = await fetch('https://open.er-api.com/v6/latest/USD')
      const j = await fx.json()
      return j.rates?.JPY
    })
    out.USDJPY = typeof r === 'number' ? r : null
  } catch { out.USDJPY = null }
  out.updated = Math.floor(Date.now() / 1000)
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2))
  await browser.close()
  console.log('updated', OUT)
}

main()
