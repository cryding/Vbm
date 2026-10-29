import { NextResponse } from "next/server";
export const runtime = "nodejs";
export async function GET() {
  return NextResponse.json({
    searchConfigured: Boolean(process.env.TAVILY_API_KEY),
    aiConfigured: Boolean(process.env.GEMINI_API_KEY),
    aiMode: process.env.GEMINI_API_KEY ? "Gemini API available" : "Built-in rule-based analysis",
  });
}