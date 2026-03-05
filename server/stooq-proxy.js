const http = require('http')
const url = require('url')

const PORT = process.env.PORT || 4000

function send(res, status, body, headers = {}) {
  res.writeHead(status, {
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-store',
    ...headers
  })
  res.end(body)
}

const server = http.createServer(async (req, res) => {
  const u = url.parse(req.url, true)
  if (u.pathname === '/stooq') {
    const code = u.query.s
    const f = u.query.f || 'sd2t2ohlcv'
    const h = u.query.h || 'e'
    if (!code) return send(res, 400, 'missing s')
    const target = `https://stooq.com/q/l/?s=${encodeURIComponent(code)}&f=${encodeURIComponent(f)}&h=${encodeURIComponent(h)}`
    try {
      const { exec } = require('child_process')
      exec(`curl -s ${JSON.stringify(target)}`, (err, stdout, stderr) => {
        if (err) return send(res, 502, 'proxy error')
        if (!stdout) return send(res, 502, 'empty')
        return send(res, 200, stdout, { 'Content-Type': 'text/csv; charset=utf-8' })
      })
    } catch (e) {
      return send(res, 502, 'proxy error')
    }
  } else if (u.pathname === '/health') {
    return send(res, 200, 'ok')
  } else if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,OPTIONS',
      'Access-Control-Allow-Headers': '*'
    })
    return res.end()
  } else {
    return send(res, 404, 'not found')
  }
})

server.listen(PORT, () => {
  console.log(`stooq proxy on http://localhost:${PORT}/`)
})
