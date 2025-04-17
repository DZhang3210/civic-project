import { NextResponse } from "next/server";

const ITEMS_PER_PAGE = 20;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const start = (page - 1) * ITEMS_PER_PAGE;

  // Generate a list of integers for the requested page
  const numbers = Array.from(
    { length: ITEMS_PER_PAGE },
    (_, i) => start + i + 1
  );

  // Simulate a small delay to mimic network latency
  await new Promise((resolve) => setTimeout(resolve, 500));

  return NextResponse.json({
    numbers,
    nextPage: page + 1,
    hasMore: true,
  });
}
