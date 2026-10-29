import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";
export const maxDuration = 30;
export async function POST(req: NextRequest) {
  try {
    const { research } = await req.json();
    if (!research || !Array.isArray(research.results)) return NextResponse.json({ error: "No research results supplied." }, { status: 400 });
    const results = research.results.slice(0, 60);
    const priceRows = results.filter((r: any) => Number.isFinite(r.extractedPrice));
    const prices = priceRows.map((r: any) => Number(r.extractedPrice)).sort((a: number,b: number)=>a-b);
    const median = prices.length ? prices.length % 2 ? prices[(prices.length-1)/2] : (prices[prices.length/2-1]+prices[prices.length/2])/2 : null;
    const domains = [...new Set(results.map((r: any) => { try { return new URL(r.url).hostname.replace(/^www\./,""); } catch { return ""; } }).filter(Boolean))] as string[];
    const suppliers = results.filter((r: any) => r.category === "Wholesale suppliers");
    const trendItems = results.filter((r: any) => /trend|popular|bestseller|forecast|viral/i.test(`${r.category} ${r.title} ${r.content}`));
    const bullets = [
      `Evidence base: ${results.length} unique search results across ${domains.length} domains; treat these as leads, not a representative market sample.`,
      prices.length ? `Price signals: ${prices.length} result snippets contained a parseable INR-like price. Observed range ₹${prices[0].toLocaleString("en-IN")}–₹${prices[prices.length-1].toLocaleString("en-IN")}; median snippet price ₹${Math.round(median).toLocaleString("en-IN")}. Verify product variant, shipping, discount and date on the source page.` : "No reliable INR price was detected in the snippets. Open listings and record current price/variant manually.",
      suppliers.length ? `${suppliers.length} supplier-related search leads found. Verify GSTIN, business address, sample quality, MOQ, return terms and payment safety before ordering.` : "No clearly tagged supplier results found; broaden supplier queries or search manufacturer directories manually.",
      trendItems.length ? `${trendItems.length} results mention trend/popularity signals. These are editorial/search-result signals, not measured sales volume or proof of a rising trend.` : "Trend evidence is thin. Compare Google Trends interest over 12 months and across regions before making inventory decisions.",
      "Suggested next step: shortlist 3–5 SKUs, collect at least 10 comparable live listings per SKU, calculate landed cost and contribution margin, then test a small batch before scaling.",
    ];
    if (process.env.GEMINI_API_KEY) {
      const prompt = `You are a cautious fashion market research analyst for Indian small business ZYMALO. Use only the supplied evidence; never invent sales volumes, trend growth, supplier credentials or exact facts. Clearly distinguish evidence, inference and verification tasks. Give an actionable report with sections: Executive summary, pricing signals, trend signals, supplier due diligence, opportunities, risks, 7-day action plan. INR amounts from snippets are estimates only. Research: ${JSON.stringify({product:research.product,category:research.category,geography:research.geography,results:results.map((r:any)=>({title:r.title,url:r.url,content:r.content,category:r.category,extractedPrice:r.extractedPrice}))}).slice(0,22000)}`;
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{temperature:0.2,maxOutputTokens:1800}}),
      });
      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.map((p:any)=>p.text || "").join("\n").trim();
        if (text) return NextResponse.json({ mode:"Gemini AI analysis", analysis:text, generatedAt:new Date().toISOString(), caveats:bullets });
      }
      return NextResponse.json({ mode:"Built-in analysis (AI provider unavailable)", analysis:bullets.join("\n\n"), generatedAt:new Date().toISOString(), caveats:["Gemini request failed or quota was reached; deterministic analysis is shown instead.", ...bullets] });
    }
    return NextResponse.json({ mode:"Built-in evidence analysis (no AI key required)", analysis:bullets.join("\n\n"), generatedAt:new Date().toISOString(), caveats:bullets });
  } catch {
    return NextResponse.json({ error:"Could not analyze this research. Please run the search again." }, { status:500 });
  }
}