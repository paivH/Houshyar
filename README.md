# Houshyar 📰

A single-file bedside/wall news dashboard, tailored for Houshyar in Hawler (Erbil), Kurdistan Region.
No API keys for the dashboard itself, no backend, no build step.

**Shows:** big clock + Hawler date · Erbil weather (Open-Meteo) with 5-hour strip, sunrise/sunset, night-aware icons · Kurdish news (Rudaw + Kurdistan24) and US & World news (BBC US, NPR) in two columns, tappable with article popup, breaking-story priority, 12h rotation, maximize view · oil prices (Brent + WTI) · Islamic prayer times for Erbil (Aladhan) with next-prayer countdown · "On this day" history (Wikipedia) · feedback button that emails paiv@paiv.co.uk.

**Screensaver:** after 90 s idle it shows "Welcome back, Houshyar" (بەخێربێیتەوە) with a large clock; tap anywhere to return to the dashboard.

**Signature:** the background follows the real Erbil sun — near-black at night, warm amber glow around actual sunrise, cool tones by day. 23:00–06:00 dims to a clock-only night mode.

## Cost
The dashboard uses only free, keyless sources (Open-Meteo, Aladhan, Wikipedia, stooq, RSS). The only GitHub Action is the news fetcher, which needs **no API key** — so this project costs nothing to run.

## Deploy
1. Create a repo named `Houshyar`, add `index.html` at the root.
2. Settings → Pages → deploy from `main`, root.
3. Open `https://<user>.github.io/Houshyar` on the tablet (Fully Kiosk Browser recommended).
4. In the Actions tab, run **Fetch news** once to seed `news.json` (then it runs every 30 min).

## Configure
Everything is in the `CONFIG` object at the top of the `<script>`: location (`lat`/`lon`/`cityName`), `feeds` (name/section/url), night-mode hours, refresh intervals. `personName` sets the screensaver greeting.

## Notes
- Prayer calculation method is 3 (Muslim World League). Change `method=3` in `loadPrayer` if he prefers another.
- Oil prices are delayed quotes via stooq; treat as indicative.
- News is fetched server-side by the Action into `news.json` (no CORS issues on the tablet); a live proxy fallback covers the gap before the first run.
