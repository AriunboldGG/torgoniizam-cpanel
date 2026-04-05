import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");

  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentType = req.headers.get("content-type") ?? "";
  const body = await req.arrayBuffer();

  const res = await fetch(`${process.env.API_URL}/api/v1/lot/insert/`, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": contentType,
    },
    body,
  });

  const data = await res.json().catch(() => ({}));

  return NextResponse.json(
    typeof data === "object" && data !== null ? data : { error: "Failed to create lot" },
    { status: res.status }
  );
}
