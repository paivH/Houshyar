// scripts/fetch-news.mjs
// Fetches RSS feeds server-side and writes news.json to the repo root.
// Run by .github/workflows/news.yml every 30 minutes.

import { writeFileSync } from 'node:fs';

const FEEDS = [
  // Kurdish outlets — several candidate feed URLs each; the first that works wins.
  { name: 'Rudaw', section: 'Kurdistan · کوردستان', urls: [
    'https://www.rudaw.net/rss/rudaw?language=english',
    'https://www.rudaw.net/rss/english',
    'https://www.rudaw.net/english/rss',
    'https://rudaw.net/rss/english',
  ] },
  { name: 'K24', section: 'Kurdistan · کوردستان', urls: [
    'https://www.kurdistan24.net/en/rss',
    'https://www.kurdistan24.net/rss/en',
    'https://www.kurdistan24.net/en/feed',
    'https://www.kurdistan24.net/en/rss.xml',
  ] },
  { name: 'Shafaq', section: 'Kurdistan · کوردستان', urls: [
    'https://shafaq.com/en/rss.xml',
    'https://shafaq.com/en/feed',
    'https://shafaq.com/rss/en',
  ] },
  { name: 'BBC', section: 'US & World · جیهان', urls: [
    'https://feeds.bbci.co.uk/news/world/us_and_canada/rss.xml',
  ] },
  { name: 'NPR', section: 'US & World · جیهان', urls: [
    'https://feeds.npr.org/1004/rss.xml',
  ] },
  { name: 'BBC ME', section: 'US & World · جیهان', urls: [
    'https://feeds.bbci.co.uk/news/world/middle_east/rss.xml',
  ] },
];

const PER_FEED = 5;

const decode = (s) =>
  s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .trim();

const stripTags = (s) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

const items = [];

async function fetchOne(url) {
  const res = await fetch(url, {
    headers: {
      'user-agent': 'Mozilla/5.0 (compatible; houshyar-dashboard/1.0; +https://github.com/paivH/Houshyar)',
      'accept': 'application/rss+xml, application/xml, text/xml, */*',
    },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const xml = await res.text();
  if (!/<item[\s>]/i.test(xml)) throw new Error('no <item> in body');
  return xml;
}

for (const feed of FEEDS) {
  let got = false;
  for (const url of feed.urls) {
    try {
      const xml = await fetchOne(url);
      const blocks = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, PER_FEED);
      const pick = (b, tag) => {
        const m = b.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
        return m ? decode(m[1]) : '';
      };
      let n = 0;
      for (const [, b] of blocks) {
        const title = stripTags(pick(b, 'title'));
        if (!title) continue;
        items.push({
          src: feed.name,
          section: feed.section,
          title,
          desc: stripTags(pick(b, 'description')).slice(0, 400),
          link: pick(b, 'link'),
          date: new Date(pick(b, 'pubDate') || Date.now()).toISOString(),
        });
        n++;
      }
      if (n) { console.log(`OK   ${feed.name}: ${n} items <- ${url}`); got = true; break; }
      console.log(`EMPTY ${feed.name}: parsed 0 items <- ${url}`);
    } catch (e) {
      console.log(`FAIL ${feed.name}: ${e.message} <- ${url}`);
    }
  }
  if (!got) console.error(`!! ${feed.name}: no working feed URL found`);
}

writeFileSync(
  'news.json',
  JSON.stringify({ updated: new Date().toISOString(), items }, null, 1)
);
console.log(`wrote news.json with ${items.length} items`);
