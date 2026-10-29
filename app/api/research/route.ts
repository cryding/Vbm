import { NextRequest, NextResponse } from "next/server";
import { categorize, extractPrice, type SearchResult } from "../../../lib/research";
export const runtime = "nodejs";
export const maxDuration = 60;

const SOURCES = [
  { category: "Competitor pricing", q: (p: string) => `${p} price India site:meesho.com OR site:amazon.in OR site:flipkart.com OR site:myntra.com` },
  { category: "Trending products", q: (p: string) => `${p} trending styles India 2026 bestseller popular designs` },
  { category: "Wholesale suppliers", q: (p: string) => `${p} wholesale manufacturer supplier India MOQ IndiaMART TradeIndia` },
  { category: "Market analysis", q: (p: string) => `${p} India fashion market consumer demand trends report` },
  { category: "Google Trends signals", q: (p: string) => `${p} India search interest rising trend Google Trends` },
  { category: "Competitor listings", q: (p: string) => `${p} site:amazon.in OR site:flipkart.com OR site:myntra.com OR site:meesho.com product` },
];

export async function POST(req: NextRequest) {
  try {
    const key = process.env.TAVILY_API_KEY;
    if (!key) return NextResponse.json({ error: "Search is not configured yet. Add TAVILY_API_KEY in Vercel → Settings → Environment Variables, then redeploy." }, { status: 503 });
    const body = await req.json();
    const product = String(body.product || "").trim().slice(0, 120);
    const category = String(body.category || "").trim().slice(0, 80);
    const geography = String(body.geography || "India").trim().slice(0, 80);
    const maxResults = Math.min(10, Math.max(3, Number(body.maxResults || 6)));
    if (!product) return NextResponse.json({ error: "Enter a product or research keyword." }, { status: 400 });
    const queries = SOURCES.map(s => ({ section: s.category, query: `${s.q(product)} ${geography}` }));
    const settled = await Promise.allSettled(queries.map(async item => {
      const r = await fetch("https://api.tavily.com/search", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: key, query: item.query, search_depth: "basic", topic: "general", max_results: maxResults, include_answer: false, include_raw_content: false }),
        cache: "no-store",
      });
      if (!r.ok) throw new Error(`Search provider returned ${r.status}`);
      const data = await r.json();
      return (data.results || []).map((x: any) => {
        const price = extractPrice(`${x.title || ""} ${x.content || ""}`);
        return {
          title: String(x.title || "Untitled result").slice(0, 300),
          url: String(x.url || ""), content: String(x.content || "").slice(0, 1200),
          score: typeof x.score === "number" ? x.score : undefined,
          published_date: x.published_date || null, category: item.section,
          extractedPrice: price.amount, currency: price.currency, priceEvidence: price.evidence,
        } as SearchResult;
      });
    }));
    const errors = settled.filter(x => x.status === "rejected").length;
    const results = settled.flatMap(x => x.status === "fulfilled" ? x.value : []);
    const seen = new Set<string>();
    const unique = results.filter((r: SearchResult) => {
      try { const u = new URL(r.url); u.hash = ""; const normalized = u.toString().replace(/\/$/, ""); if (!normalized || seen.has(normalized)) return false; seen.add(normalized); return true; }
      catch { return false; }
    });
    const prices = unique.filter((r: SearchResult) => r.extractedPrice !== null).map((r: SearchResult) => r.extractedPrice as number).sort((a: number,b: number)=>a-b);
    const median = prices.length ? (prices.length % 2 ? prices[(prices.length-1)/2] : (prices[prices.length/2-1]+prices[prices.length/2])/2) : null;
    const domains = [...new Set(unique.map((r: SearchResult) => { try { return new URL(r.url).hostname.replace(/^www\./,""); } catch { return ""; } }).filter(Boolean))];
    const result = {
      id: crypto.randomUUID(), createdAt: new Date().toISOString(), product, category, geography,
      results: unique, queryCount: queries.length, failedQueries: errors, priceCount: prices.length,
      medianPrice: median, lowPrice: prices.length ? prices[0] : null, highPrice: prices.length ? prices[prices.length-1] : null,
      domains, trends: unique.filter((r: SearchResult) => r.category === "Trending products" || r.category === "Google Trends signals"),
      suppliers: unique.filter((r: SearchResult) => r.category === "Wholesale suppliers"),
      priceLeads: unique.filter((r: SearchResult) => r.extractedPrice !== null),
    };
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Research failed. Try again." }, { status: 500 });
  }
}