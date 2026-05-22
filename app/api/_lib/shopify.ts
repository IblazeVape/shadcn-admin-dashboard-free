// app/api/_lib/shopify.ts
import { NextRequest } from "next/server";

/**
 * Dispatches a request payload directly to the Shopify Admin GraphQL API
 * utilizing your securely stored Vercel environment variables.
 */
export async function shopifyRequest(query: string, variables = {}) {
  const shop = process.env.SHOPIFY_STORE_URL;
  const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

  if (!shop || !accessToken) {
    throw new Error("Missing Shopify setup config parameters in environment variables.");
  }

  // Maintains your specific API version constraint configuration rules
  const response = await fetch(`https://${shop}/admin/api/2024-04/graphql.json`, {
    method: "POST",
    headers: {
      "X-Shopify-Access-Token": accessToken,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  const result = await response.json();
  if (result.errors) {
    console.error("Shopify GraphQL Errors:", result.errors);
    throw new Error(result.errors[0].message);
  }

  return result.data;
}

/**
 * Extracts and tokenizes the existing portal cookie from the request headers
 */
export function parseSessionCookie(req: NextRequest) {
  const sessionCookie = req.cookies.get("portal_session")?.value;
  if (!sessionCookie) return null;

  const [sessionEmail, accessToken, expiryTime, sessionSig] = sessionCookie.split("|");
  return {
    sessionEmail,
    accessToken,
    expiryTime: parseInt(expiryTime, 10),
    sessionSig,
  };
}
