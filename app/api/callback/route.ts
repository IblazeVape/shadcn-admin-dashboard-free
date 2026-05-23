import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get("code");
    if (!code) return new NextResponse("Authorisation code missing.", { status: 400 });

    const shop = "iblazevape.co.uk";
    const clientId = process.env.CUSTOMER_API_CLIENT_ID;
    const clientSecret = process.env.CUSTOMER_API_CLIENT_SECRET;
    const redirectUri = "https://shadcn-admin-dashboard-free-pi.vercel.app/api/callback";

    const discoveryRes = await fetch(`https://account.${shop}/.well-known/openid-configuration`);
    const config = await discoveryRes.json();

    const body = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId!,
      redirect_uri: redirectUri,
      code: code,
    });

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const tokenRes = await fetch(config.token_endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`,
      },
      body,
    });

    const tokenData = await tokenRes.json();
    if (tokenData.error) throw new Error(tokenData.error_description);

    const idTokenParts = tokenData.id_token.split(".");
    const payload = JSON.parse(Buffer.from(idTokenParts[1], "base64").toString());

    const portalSecret = process.env.PORTAL_SECRET!;
    const expiryTime = Math.floor(Date.now() / 1000) + 7200;

    const sessionData = `${payload.email}|${tokenData.access_token}|${expiryTime}`;
    const sig = crypto.createHmac("sha256", portalSecret).update(sessionData).digest("hex");
    const cookieValue = `${sessionData}|${sig}`;

    const response = NextResponse.redirect(new URL("/", req.url));
    response.cookies.set("portal_session", cookieValue, {
      httpOnly: true,
      secure: true,
      path: "/",
      maxAge: 7200,
      sameSite: "lax",
    });

    return response;
  } catch (error: any) {
    console.error("Authorisation Error:", error.message);
    return new NextResponse(`OAuth Callback Failed: ${error.message}`, { status: 500 });
  }
}
