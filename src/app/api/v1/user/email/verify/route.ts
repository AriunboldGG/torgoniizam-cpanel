import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const uidb64 = searchParams.get("uidb64");
  const token = searchParams.get("token");

  if (!uidb64 || !token) {
    return NextResponse.json({ error: "Missing uidb64 or token" }, { status: 400 });
  }

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/user/email/verify?uidb64=${encodeURIComponent(uidb64)}&token=${encodeURIComponent(token)}`,
    { method: "GET", headers: { "Content-Type": "application/json" } }
  );

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
