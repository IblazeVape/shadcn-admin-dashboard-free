
// app/api/login/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const shop = "iblazevape.co.uk";
    const clientId = process.env.CUSTOMER_API_CLIENT_ID;
    
    // Explicitly using your production Vercel callback path
    const redirectUri = "https://shadcn-admin-dashboard-free-pi.vercel.app/api/callback";

    // Hit your dedicated account subdomain for the OpenID config
    const discoveryRes = await fetch(`https://account.${shop}/.well-known/openid-configuration`);
    const authConfig = await discoveryRes.json();

    const authUrl = new URL(authConfig.authorization_endpoint);
    authUrl.searchParams.append('scope', 'openid email customer-account-api:full');
    authUrl.searchParams.append('client_id', clientId!);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('state', Math.random().toString(36).substring(2));

    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    return new NextResponse("Authentication initialization failed.", { status: 500 });
  }
}
