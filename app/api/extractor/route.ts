// app/api/extractor/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "No authorisation code found in URL." });
  }

  try {
    // Using environment variables from Screenshot 2026-05-23 at 10.12.20.jpg
    const response = await fetch(`https://6jjpzt-jz.myshopify.com/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.SHOPIFY_CLIENT_ID,
        client_secret: process.env.SHOPIFY_CLIENT_SECRET, 
        code: code,
      }),
    });

    const data = await response.json();

    if (data.access_token) {
      return new NextResponse(`
        <html>
          <body style="font-family: sans-serif; padding: 50px; text-align: center; background: #09090b; color: #fff;">
            <h1 style="color: #4ade80;">Token Successfully Captured!</h1>
            <p>Copy this string exactly and save it in Vercel as <strong>SHOPIFY_ACCESS_TOKEN</strong>:</p>
            <div style="background: #18181b; padding: 20px; font-size: 24px; margin: 20px auto; max-width: 600px; border: 2px dashed #4ade80; user-select: all; word-break: break-all;">
              ${data.access_token}
            </div>
          </body>
        </html>
      `, { headers: { 'Content-Type': 'text/html' } });
    } else {
      return NextResponse.json({ error: "Token exchange failed", details: data });
    }
  } catch (err: any) {
    return NextResponse.json({ error: "Pipeline error", message: err.message });
  }
}
