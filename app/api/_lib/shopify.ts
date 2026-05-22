// app/api/_lib/shopify.ts
import { NextRequest } from "next/server";

export interface SessionData {
  sessionEmail: string;
  accessToken: string;
  expiryTime: string;
  sessionSig: string;
}

/**
 * Extracts and decodes the active HttpOnly customer portal session cookie
 */
export function parseSessionCookie(req: NextRequest): SessionData | null {
  const cookieValue = req.cookies.get("portal_session")?.value;
  if (!cookieValue) return null;

  const parts = cookieValue.split("|");
  if (parts.length !== 4) return null;

  const [sessionEmail, accessToken, expiryTime, sessionSig] = parts;
  return { sessionEmail, accessToken, expiryTime, sessionSig };
}

/**
 * Standard utility wrapper to run authenticated requests against the Shopify Admin GraphQL API
 */
export async function shopifyRequest(query: string, variables = {}) {
  const shop = process.env.SHOPIFY_STORE_URL || "6jjpzt-jz.myshopify.com";
  const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error("Missing SHOPIFY_ACCESS_TOKEN inside server environment variables.");
  }

  const response = await fetch(`https://${shop}/admin/api/2026-04/graphql.json`, {
    method: "POST",
    headers: {
      "X-Shopify-Access-Token": accessToken,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  const result = await response.json();
  if (result.errors) {
    throw new Error(result.errors[0].message);
  }

  return result.data;
}
