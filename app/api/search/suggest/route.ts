import { NextRequest, NextResponse } from "next/server";
import { getSearchSuggestions } from "@/lib/services/catalog";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") ?? "";
  if (!query.trim()) return NextResponse.json({ suggestions: [] });

  const suggestions = await getSearchSuggestions(query, 8);
  return NextResponse.json({ suggestions });
}
