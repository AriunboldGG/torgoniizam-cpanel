import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  const body = new URLSearchParams({
    username,
    password,
    client_id: process.env.OAUTH_CLIENT_ID ?? "",
    client_secret: process.env.OAUTH_CLIENT_SECRET ?? "",
    grant_type: process.env.OAUTH_GRANT_TYPE ?? "password",
  });

  const res = await fetch(
    `${process.env.API_URL}/api/oauth2/token/`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    }
  );

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    return NextResponse.json(
      { error: data?.error_description ?? "Имэйл эсвэл нууц үг буруу байна." },
      { status: res.status }
    );
  }

  return NextResponse.json(data, { status: 200 });
}
