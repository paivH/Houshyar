// scripts/markets.mjs
// Fetches oil prices server-side (no CORS, GitHub runner has open internet)
// and writes markets.json. Tries several sources and logs which one worked.
// No API key required.

import { writeFileSync } from 'node:fs';

const UA = { 'user-agent': 'Mozilla/5.0 (compatible; houshyar-dashboard/1.0)' };

// --- source 1: Yahoo Finance chart API (JSON) ---
async function yahoo(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=5d`;
  const r = await fetch(url, { headers: UA });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const d = await r.json();
  const res = d?.chart?.result?.[0];
  const meta = res?.meta;
  if (!meta?.regularMarketPrice) throw new Error('no price in payload');
  const price = meta.regularMarketPrice;
  const prev = meta.chartPreviousClose ?? meta.previousClose;
  return { price, chg: prev ? ((price - prev) / prev) * 100 : null };
}

// --- source 2: stooq CSV ---
async function stooq(code) {
  const url = `https://stooq.com/q/l/?s=${code}&f=sd2t2ohlcv&h&e=csv`;
  const r = await fetch(url, { headers: UA });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const text = await r.text();
  const lines = text.trim().split('\n');
  if (lines.length < 2) throw new Error('no data rows');
  const c = lines[lines.length - 1].split(',');
  const open = parseFloat(c[3]);
  const close = parseFloat(c[6]);
  if (!close || isNaN(close)) throw new Error('unparseable close');
  return { price: close, chg: open ? ((close - open) / open) * 100 : null };
}

const TARGETS = [
  { label: 'Brent', yahoo: 'BZ=F', stooq: 'cb.f' },
  { label: 'WTI', yahoo: 'CL=F', stooq: 'cl.f' },
];

const quotes = [];
for (const t of TARGETS) {
  let got = null;
  try {
    got = await yahoo(t.yahoo);
    console.log(`OK   ${t.label}: $${got.price.toFixed(2)} <- yahoo ${t.yahoo}`);
  } catch (e) {
    console.log(`FAIL ${t.label}: ${e.message} <- yahoo ${t.yahoo}`);
    try {
      got = await stooq(t.stooq);
      console.log(`OK   ${t.label}: $${got.price.toFixed(2)} <- stooq ${t.stooq}`);
    } catch (e2) {
      console.log(`FAIL ${t.label}: ${e2.message} <- stooq ${t.stooq}`);
    }
  }
  if (got) quotes.push({ label: t.label, price: got.price, chg: got.chg });
}

if (!quotes.length) {
  console.error('!! no market source worked; leaving previous markets.json in place');
  process.exit(1);
}

writeFileSync('markets.json', JSON.stringify({
  updated: new Date().toISOString(),
  quotes,
}, null, 1));
console.log(`wrote markets.json with ${quotes.length} quotes`);
