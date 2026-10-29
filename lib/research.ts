export type SearchResult = {
  title: string; url: string; content: string; score?: number; published_date?: string | null;
  category: string; extractedPrice: number | null; currency: string | null; priceEvidence: string | null;
};
export const categories = ["Kurtis", "Sarees", "Women's dresses", "Men's clothing", "Tops & co-ord sets"];
export function extractPrice(text: string): { amount: number | null; currency: string | null; evidence: string | null } {
  const s = text.replace(/,/g, "");
  const patterns = [
    /(?:₹|INR|Rs\.?|rupees?)\s*([0-9]{2,7}(?:\.[0-9]{1,2})?)/i,
    /([0-9]{2,7}(?:\.[0-9]{1,2})?)\s*(?:₹|INR|Rs\.?)(?![a-z])/i,
  ];
  for (const p of patterns) {
    const m = s.match(p);
    if (m) {
      const amount = Number(m[1]);
      if (amount >= 20 && amount <= 1000000) return { amount, currency: "INR", evidence: m[0].trim() };
    }
  }
  return { amount: null, currency: null, evidence: null };
}
export function categorize(title: string, content: string): string {
  const t = `${title} ${content}`.toLowerCase();
  if (/wholesale|manufacturer|supplier|india.?mart|tradeindia|bulk order|moq/.test(t)) return "Supplier";
  if (/trend|popular|bestseller|viral|forecast|fashion week|google trends/.test(t)) return "Trend";
  if (/amazon|flipkart|meesho|myntra|product|buy|shop|price|₹|inr|rs\.?/.test(t)) return "Competitor";
  return "Market signal";
}