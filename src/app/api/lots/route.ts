import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {

  const authHeader = req.headers.get("authorization");

  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/lot/seller/list`, {
    method: "GET",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    return NextResponse.json(
      { error: data?.detail ?? "Failed to fetch lots" },
      { status: res.status }
    );
  }

  return NextResponse.json(data, { status: 200 });
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");

  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Forward raw bytes with original Content-Type (preserves multipart boundary)
  const contentType = req.headers.get("content-type") ?? "";
  const body = await req.arrayBuffer();

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/lot/insert/`, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": contentType,
    },
    body,
  });

  const data = await res.json().catch(() => ({}));

  // Forward body regardless of status so client sees validation errors
  return NextResponse.json(
    typeof data === "object" && data !== null ? data : { error: "Failed to create lot" },
    { status: res.status }
  );
}
