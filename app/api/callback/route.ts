// app/api/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get("code");
    if (!code) return new NextResponse("Authorisation code missing.", { status: 400 });

    // Ensure this matches your primary store domain where customer accounts live
    const shop = "iblazevape.co.uk"; 
    const clientId = process.env.CUSTOMER_API_CLIENT_ID;
    const clientSecret = process.env.CUSTOMER_API_CLIENT_SECRET;
    
    // This MUST match the exact Redirect URI registered in your Shopify App Setup
    const redirectUri = `https://shadcn-admin-dashboard-free-pi.vercel.app/api/callback`;

    // Discovery must hit the account subdomain to retrieve valid keys
    const discoveryRes = await fetch(`https://account.${shop}/.well-known/openid-configuration`);
    const config = await discoveryRes.json();

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId!,
      redirect_uri: redirectUri,
      code: code
    });

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const tokenRes = await fetch(config.token_endpoint, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded', 
        'Authorization': `Basic ${credentials}` 
      },
      body
    });

    const tokenData = await tokenRes.json();
    if (tokenData.error) throw new Error(tokenData.error_description);

    // Decode ID Token
    const idTokenParts = tokenData.id_token.split('.');
    const payload = JSON.parse(Buffer.from(idTokenParts[1], 'base64').toString());
    
    const portalSecret = process.env.PORTAL_SECRET!;
    const expiryTime = Math.floor(Date.now() / 1000) + 7200; 
    
    const sessionData = `${payload.email}|${tokenData.access_token}|${expiryTime}`;
    const sig = crypto.createHmac('sha256', portalSecret).update(sessionData).digest('hex');

    // Create response and set cookie for your Vercel domain
    const response = NextResponse.redirect(new URL('/dashboard', req.url));
    response.cookies.set('portal_session', `${sessionData}|${sig}`, {
      httpOnly: true, 
      secure: true, 
      path: '/', 
      maxAge: 7200, 
      sameSite: 'lax',
      domain: 'shadcn-admin-dashboard-free-pi.vercel.app' // Bind to your app domain
    });

    return response;
  } catch (error: any) {
    return new NextResponse(`OAuth Callback Failed: ${error.message}`, { status: 500 });
  }
}
