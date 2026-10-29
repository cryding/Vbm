# ZYMALO Intelligence — Full Upgrade (Vercel)

A responsive Next.js research workspace for Indian fashion categories: kurtis, sarees, women's dresses, men's clothing, and tops/co-ord sets.

## What is implemented

- **Public web research:** server-side Tavily searches across six angles: competitor pricing, trending products, wholesale suppliers, market analysis, Google Trends-related signals, and competitor listings.
- **Competitor price extraction:** conservative INR/₹/Rs pattern extraction from search-result titles/snippets. Every extracted amount is labelled an estimate, with the matching text evidence available in Excel.
- **AI market analysis:** evidence-based fallback analysis works without an LLM key. Optional Gemini API integration (`GEMINI_API_KEY`) produces a more narrative report. If Gemini fails or quota is exhausted, the app falls back to the built-in analysis.
- **Supplier research:** supplier/manufacturer search leads are separated in the UI and workbook. The app does not certify suppliers; verification remains a human task.
- **Trending-product discovery:** search angles collect public trend/editorial/search-interest leads. These are not proof of sales or rising search volume.
- **Excel export:** browser-generated `.xlsx` with Executive Summary, Research Results, Price Signals, Supplier Leads, Trend Signals, and Local Price History sheets.
- **Historical price tracking:** research snapshots are saved in the current browser's `localStorage`, and can be reviewed/re-exported. This is per-browser/device, not shared cloud storage.
- **Modern responsive UI:** dashboard metrics, filters, tabs, loading/error states, history table, and source links.
- **Server-side API keys:** Tavily and Gemini keys are only read by server routes and are never passed to client code.

## What requires keys / verification

| Capability | Status | Requirements / limitations |
|---|---|---|
| Live web search | Implemented | Requires `TAVILY_API_KEY` from Tavily; API plan/limits apply |
| Price extraction | Implemented | Reads search snippets only; amounts may be missing or wrong and must be checked on source pages |
| Narrative AI analysis | Optional | `GEMINI_API_KEY` enables Gemini; otherwise deterministic evidence-based analysis is used |
| Excel export | Implemented | Generated in the browser; no API key needed after results are loaded |
| Price history | Implemented locally | Stored in this browser only; clearing browser data/device changes removes or isolates history |
| Trend discovery | Implemented as lead discovery | For true search-interest measurements, open Google Trends and compare region/date range manually |
| Supplier leads | Implemented as discovery | GSTIN, address, sample, MOQ, capacity, payment terms and references must be verified manually |
| Direct marketplace scraping | Not implemented | No login/captcha bypass or anti-bot circumvention; marketplace access and terms vary |

Google search pages are not scraped. Tavily provides general web search results, including results that may reference Google Trends and marketplaces. It does not guarantee complete coverage or exact prices.

## Deploy to Vercel

1. Download and unzip this project.
2. Create/import a GitHub repository with the contents of this folder (the `package.json` must be at the repository root).
3. In Vercel, choose **Add New → Project** and import the repository.
4. In **Project → Settings → Environment Variables**, add:
   - `TAVILY_API_KEY` — required for live web research.
   - `GEMINI_API_KEY` — optional, for Gemini narrative analysis.
5. Select the relevant environments (Production, Preview, Development), save, then redeploy.
6. Open the deployed URL and run a search. The top bar indicates whether the search key is configured.

## Local development (optional)

Requires Node.js 20+.

```bash
npm install
cp .env.example .env.local
# Add your private keys to .env.local
npm run dev
```

## API endpoints

- `GET /api/health` — reports whether server-side keys are configured (never returns key values).
- `POST /api/research` — performs public web searches and returns deduplicated results, parsed price leads and trend/supplier subsets.
- `POST /api/analyze` — runs optional Gemini analysis or built-in evidence-based analysis.

## Important implementation notes

- Six Tavily searches are sent per run; provider credits and rate limits apply.
- Historical snapshots are stored in browser `localStorage`, capped at 80 records. It is not a shared database and does not sync across devices.
- The research UI currently stores the whole result snapshot locally for history. Avoid using a shared/public browser for sensitive internal research.
- Search-result snippets are leads, not a verified market dataset. Do not make inventory or supplier-payment decisions from the summary alone.
- No deployment has been performed by this project generator. Deploy it from your own Vercel account.
