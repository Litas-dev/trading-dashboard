import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Search, Menu, TrendingUp, TrendingDown, ChevronDown } from 'lucide-react';

const data = [
  { time: '19:00', value: 5458 },
  { time: '20:00', value: 5462 },
  { time: '21:00', value: 5470 },
  { time: '22:00', value: 5460 },
  { time: '23:00', value: 5468 },
];

const initialIndices = [
  { name: 'S&P 500 (SPY)', symbol: 'spy.us', value: null, change: 0, color: 'green', flag: '🇺🇸' },
  { name: 'Nasdaq 100 (QQQ)', symbol: 'qqq.us', value: null, change: 0, color: 'green', flag: '🇺🇸' },
  { name: 'Dow 30 (DIA)', symbol: 'dia.us', value: null, change: 0, color: 'green', flag: '🇺🇸' },
  { name: 'Japan (EWJ)', symbol: 'ewj.us', value: null, change: 0, color: 'green', flag: '🇯🇵' },
];

const initialWatchlist = [
  { symbol: 'SPY', src: { type: 'stooq', code: 'spy.us' }, price: null, change: 0, color: 'green' },
  { symbol: 'QQQ', src: { type: 'stooq', code: 'qqq.us' }, price: null, change: 0, color: 'green' },
  { symbol: 'DIA', src: { type: 'stooq', code: 'dia.us' }, price: null, change: 0, color: 'green' },
  { symbol: 'BTCUSD', src: { type: 'binance', symbol: 'BTCUSDT' }, price: null, change: 0, color: 'green' },
  { symbol: 'VIXY', src: { type: 'stooq', code: 'vixy.us' }, price: null, change: 0, color: 'green' },
  { symbol: 'GLD', src: { type: 'stooq', code: 'gld.us' }, price: null, change: 0, color: 'green' },
  { symbol: 'USO', src: { type: 'stooq', code: 'uso.us' }, price: null, change: 0, color: 'green' },
  { symbol: 'USDJPY', src: { type: 'fx', base: 'USD', symbol: 'JPY' }, price: null, change: 0, color: 'green' },
];

const TradingDashboard = () => {
  const [indices, setIndices] = useState(initialIndices);
  const [watchlistItems, setWatchlistItems] = useState(initialWatchlist);
  const [watchlistFilter, setWatchlistFilter] = useState('All');
  const [watchlistOpen, setWatchlistOpen] = useState(false);

  useEffect(() => {
    let active = true;
    const prevRef = { prices: {} };
    const parseStooqCsv = (csv) => {
      const lines = csv.trim().split('\n');
      if (lines.length < 2) return null;
      const headers = lines[0].split(',');
      const values = lines[1].split(',');
      const row = Object.fromEntries(headers.map((h, i) => [h.toLowerCase(), values[i]]));
      return row;
    };
    const fetchStooq = async (code) => {
      // Prefer local proxy to avoid CORS/network limits
      try {
        const url = `http://localhost:4000/stooq?s=${encodeURIComponent(code)}&f=sd2t2ohlcv&h=e`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('proxy failed');
        const text = await res.text();
        const row = parseStooqCsv(text);
        if (!row || row.close === 'N/D') return null;
        return { price: parseFloat(row.close), open: parseFloat(row.open) };
      } catch {
        return null;
      }
    };
    const fetchBinance = async (symbol) => {
      const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
      const json = await res.json();
      return { price: parseFloat(json.price) };
    };
    const fetchBinanceDetail = async (symbol) => {
      try {
        const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`);
        const j = await res.json();
        const price = parseFloat(j.lastPrice ?? j.weightedAvgPrice ?? j.prevClosePrice ?? j.close ?? 0);
        const pct = parseFloat(j.priceChangePercent ?? 0);
        return { price, changePct: Number.isFinite(pct) ? pct : 0 };
      } catch {
        return null;
      }
    };
    const fetchCoingeckoBTC = async () => {
      try {
        const res = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin`);
        const arr = await res.json();
        const it = Array.isArray(arr) ? arr[0] : null;
        if (!it) return null;
        const price = parseFloat(it.current_price);
        const pct = parseFloat(it.price_change_percentage_24h);
        if (!Number.isFinite(price)) return null;
        return { price, changePct: Number.isFinite(pct) ? pct : null };
      } catch {
        return null;
      }
    };
    const fetchFx = async (base, symbol) => {
      const res = await fetch(`https://open.er-api.com/v6/latest/${base}`);
      const json = await res.json();
      const rate = json?.rates?.[symbol];
      if (!rate) return null;
      return { price: rate };
    };
    const fetchFxDailyChange = async (base, symbol) => {
      try {
        const latestRes = await fetch(`https://api.frankfurter.app/latest?from=${base}&to=${symbol}`);
        const latest = await latestRes.json();
        const price = latest?.rates?.[symbol];
        if (!price) return null;
        const d = new Date();
        d.setDate(d.getDate() - 1);
        const y = d.toISOString().slice(0, 10);
        const prevRes = await fetch(`https://api.frankfurter.app/${y}?from=${base}&to=${symbol}`);
        const prev = await prevRes.json();
        const prevPrice = prev?.rates?.[symbol];
        let changePct = 0;
        if (typeof prevPrice === 'number' && prevPrice > 0) {
          changePct = ((price - prevPrice) / prevPrice) * 100;
        }
        return { price, changePct };
      } catch {
        return null;
      }
    };
    const refresh = async () => {
      // Try local aggregated file first
      let agg = null
      try {
        const bust = Date.now()
        const res = await fetch(`/prices.json?_=${bust}`)
        if (res.ok) agg = await res.json()
      } catch {}
      // indices via stooq ETFs
      const idxUpdates = await Promise.all(indices.map(async (idx) => {
        const aggKey = idx.symbol.toUpperCase().split('.')[0]
        const useAgg = agg && agg[aggKey] != null
        const aggOpenKey = `${aggKey}_OPEN`
        const openVal = agg && agg[aggOpenKey] != null ? parseFloat(agg[aggOpenKey]) : null
        const quote = useAgg ? { price: agg[aggKey], open: openVal } : await fetchStooq(idx.symbol);
        if (!quote) return idx;
        const changePct = Number.isFinite(quote.open) ? ((quote.price - quote.open) / quote.open) * 100 : 0;
        return {
          ...idx,
          value: quote.price,
          change: parseFloat(changePct.toFixed(2)),
          color: changePct >= 0 ? 'green' : 'red'
        };
      }));
      if (active) setIndices(idxUpdates);
      // watchlist mixed sources
      const wlUpdates = await Promise.all(watchlistItems.map(async (item) => {
        let quote = null;
        if (item.src.type === 'stooq') {
          const key = item.symbol.toUpperCase()
          const useAgg = agg && agg[key] != null
          const openVal = agg && agg[`${key}_OPEN`] != null ? parseFloat(agg[`${key}_OPEN`]) : null
          quote = useAgg ? { price: agg[key], open: openVal } : await fetchStooq(item.src.code);
        } else if (item.src.type === 'binance') {
          const useAgg = agg && item.src.symbol === 'BTCUSDT' && agg.BTCUSDT != null
          if (useAgg) {
            if (agg.BTCUSDT_CHANGE != null) {
              quote = { price: agg.BTCUSDT, open: null, changePct: agg.BTCUSDT_CHANGE }
            } else {
              const b = await fetchBinanceDetail(item.src.symbol);
              if (b) quote = { price: b.price, open: null, changePct: b.changePct }
              else {
                const cg = await fetchCoingeckoBTC();
                if (cg) quote = { price: cg.price, open: null, changePct: cg.changePct }
                else quote = await fetchBinance(item.src.symbol);
              }
            }
          } else {
            const b = await fetchBinanceDetail(item.src.symbol);
            if (b) quote = { price: b.price, open: null, changePct: b.changePct }
            else {
              const cg = await fetchCoingeckoBTC();
              if (cg) quote = { price: cg.price, open: null, changePct: cg.changePct }
              else quote = await fetchBinance(item.src.symbol);
            }
          }
        } else if (item.src.type === 'fx') {
          const useAgg = agg && item.src.symbol === 'JPY' && agg.USDJPY != null
          if (useAgg) {
            const daily = await fetchFxDailyChange(item.src.base, item.src.symbol);
            quote = { price: agg.USDJPY, open: null, changePct: daily ? daily.changePct : null }
          } else {
            const daily = await fetchFxDailyChange(item.src.base, item.src.symbol);
            if (daily) quote = { price: daily.price, open: null, changePct: daily.changePct }
            else quote = await fetchFx(item.src.base, item.src.symbol);
          }
        }
        if (!quote) return item;
        let change = item.change || 0;
        if (item.src.type === 'stooq' && Number.isFinite(quote.open)) {
          change = parseFloat((((quote.price - quote.open) / quote.open) * 100).toFixed(2))
        }
        if (item.src.type === 'binance') {
          if (typeof quote.changePct === 'number') {
            change = parseFloat(quote.changePct)
          }
        }
        if (item.src.type === 'fx') {
          if (typeof quote.changePct === 'number') {
            change = parseFloat(quote.changePct.toFixed(2))
          } else if (prevRef.prices[item.symbol]) {
            const prev = prevRef.prices[item.symbol]
            if (Number.isFinite(prev) && Number.isFinite(quote.price)) {
              let cpct = ((quote.price - prev) / prev) * 100
              const sign = Math.sign(cpct)
              cpct = parseFloat(cpct.toFixed(3))
              if (cpct === 0 && sign !== 0) cpct = sign * 0.01
              change = cpct
            }
          }
        }
        prevRef.prices[item.symbol] = quote.price
        return {
          ...item,
          price: quote.price,
          color: change >= 0 ? 'green' : 'red',
          change
        };
      }));
      if (active) setWatchlistItems(wlUpdates);
    };
    refresh();
    const iv = setInterval(refresh, 15000);
    return () => { active = false; clearInterval(iv); };
  }, []);

  return (
    <div className="bg-gray-900 text-white min-h-screen font-sans flex flex-col">
      <header className="bg-gray-800 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <span className="text-2xl font-bold text-blue-500">TY</span>
          <nav className="hidden md:flex space-x-6">
            {['Products', 'Community', 'Markets', 'News', 'Brokers'].map((item) => (
              <a key={item} href="#" className="text-gray-300 hover:text-blue-400 transition-colors duration-200">{item}</a>
            ))}
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <input type="text" placeholder="Search" className="bg-gray-700 text-white rounded-full py-2 px-4 pl-10 w-40 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200" />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          </div>
          <button className="bg-blue-600 rounded-full p-2 hover:bg-blue-700 transition-colors duration-200">
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>
      
      <main className="flex-grow p-6 overflow-hidden flex">
        <div className="flex-grow mr-4">
          <h2 className="text-2xl font-semibold mb-6 text-blue-400">Market Summary</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {indices.map((index) => (
              <div key={index.name} className="bg-gray-800 p-4 rounded-lg shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400 flex items-center">
                    <span className="mr-2 text-lg">{index.flag}</span>
                    {index.name}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${index.color === 'green' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                    {index.change > 0 ? '+' : ''}{index.change}%
                  </span>
                </div>
                <div className="text-2xl font-bold">{Number.isFinite(index.value) ? index.value.toLocaleString() : '—'}</div>
              </div>
            ))}
          </div>
          
          <div className="bg-gray-800 p-4 rounded-lg shadow-lg h-64 sm:h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <XAxis dataKey="time" stroke="#6B7280" />
                <YAxis domain={['dataMin - 5', 'dataMax + 5']} stroke="#6B7280" />
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none' }} />
                <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <aside className="w-64 bg-gray-800 p-4 rounded-lg overflow-y-auto relative">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-blue-400">Watchlist</h3>
            <div className="relative">
              <button
                className="bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-full px-3 py-1 flex items-center transition-colors duration-200"
                onClick={() => setWatchlistOpen((v) => !v)}
              >
                <span className="mr-2 text-sm">{watchlistFilter}</span>
                <ChevronDown className="w-4 h-4 text-gray-300" />
              </button>
              {watchlistOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10">
                  {['All', 'Equities', 'Crypto', 'FX'].map((opt) => (
                    <button
                      key={opt}
                      className={`block w-full text-left px-3 py-2 text-sm ${
                        watchlistFilter === opt ? 'text-blue-400' : 'text-gray-200'
                      } hover:bg-gray-700`}
                      onClick={() => { setWatchlistFilter(opt); setWatchlistOpen(false); }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <ul className="space-y-2">
            {(watchlistFilter === 'All'
              ? watchlistItems
              : watchlistItems.filter((it) => {
                  if (watchlistFilter === 'Equities') return it.src.type === 'stooq';
                  if (watchlistFilter === 'Crypto') return it.src.type === 'binance';
                  if (watchlistFilter === 'FX') return it.src.type === 'fx';
                  return true;
                })
            ).map((item) => (
              <li key={item.symbol} className="flex justify-between items-center p-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors duration-200">
                <div>
                  <span className="font-medium">{item.symbol}</span>
                  <span className="block text-sm text-gray-400">{Number.isFinite(item.price) ? item.price.toLocaleString() : '—'}</span>
                </div>
                <div className={`flex items-center ${item.color === 'green' ? 'text-green-400' : 'text-red-400'}`}>
                  {item.color === 'green' ? <TrendingUp size={16} className="mr-1" /> : <TrendingDown size={16} className="mr-1" />}
                  <span>{item.change > 0 ? '+' : ''}{item.change}%</span>
                </div>
              </li>
            ))}
          </ul>
        </aside>
      </main>
    </div>
  );
};

export default TradingDashboard;
