// app/api/get-orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  try {
    // 1. Extract and split active session track metrics
    const sessionCookie = req.cookies.get("portal_session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "Session missing. Please log in." }, { status: 401 });
    }

    const [sessionEmail, accessToken, expiryTime, sessionSig] = sessionCookie.split("|");
    const portalSecret = process.env.PORTAL_SECRET;

    if (!portalSecret) {
      return NextResponse.json({ error: "Configuration mismatch on server environment variables." }, { status: 500 });
    }

    // 2. Validate current token session expiration window
    const currentTimestamp = Math.floor(Date.now() / 1000);
    if (currentTimestamp > parseInt(expiryTime, 10)) {
      return NextResponse.json({ error: "Session expired. Please log in again." }, { status: 401 });
    }

    // 3. Authenticate user matching signature verification checksum rules
    const expectedSig = crypto
      .createHmac("sha256", portalSecret)
      .update(`${sessionEmail}|${accessToken}|${expiryTime}`)
      .digest("hex");

    if (sessionSig !== expectedSig) {
      return NextResponse.json({ error: "Unauthorised session signature context profile trace parameters." }, { status: 403 });
    }

    const shop = process.env.SHOPIFY_STORE_URL || "6jjpzt-jz.myshopify.com";
    const shopifyAccessToken = process.env.SHOPIFY_ACCESS_TOKEN;

    // Strict GraphQL operational query format parameters
    const query = `
      query GetOrders($query: String!) {
        shop { id }
        customers(first: 1, query: $query) {
          edges {
            node {
              firstName
              orders(first: 20, sortKey: CREATED_AT, reverse: true) {
                edges {
                  node {
                    id name createdAt displayFulfillmentStatus
                    totalPriceSet { shopMoney { amount currencyCode } }
                    fulfillments(first: 5) { createdAt displayStatus trackingInfo { number } }
                    lineItems(first: 50) { edges { node { id title quantity image { url } variant { title } } } }
                  }
                }
              }
            }
          }
        }
      }
    `;

    const response = await fetch(`https://${shop}/admin/api/2026-04/graphql.json`, {
      method: "POST",
      headers: { 
        "X-Shopify-Access-Token": shopifyAccessToken!, 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({ query, variables: { query: `email:${sessionEmail}` } })
    });

    const result = await response.json();
    if (result.errors) throw new Error(result.errors[0].message);

    const shopId = result.data.shop.id.split("/").pop();
    
    // 4. Validate dynamic Customer Account API Token Handshake configuration
    const verifyRes = await fetch(`https://shopify.com/${shopId}/account/customer/api/2026-04/graphql`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": accessToken },
      body: JSON.stringify({ query: `query { customer { id } }` })
    });
    
    if (!verifyRes.ok) {
      return NextResponse.json({ error: "Session identity status revoked. Please log in again." }, { status: 401 });
    }
    const verifyData = await verifyRes.json();
    if (verifyData.errors) {
      return NextResponse.json({ error: "Session identity status revoked. Please log in again." }, { status: 401 });
    }

    const customers = result.data?.customers?.edges || [];
    if (customers.length === 0) {
      return NextResponse.json({ firstName: "", orders: [] });
    }

    const firstName = customers[0].node.firstName || "";
    const rawOrders = customers[0].node.orders.edges.map((e: any) => e.node);
    
    // 5. Build processing loops for UK item delivery status conditions
    const processedOrders = rawOrders.map((order: any) => {
      const status = order.displayFulfillmentStatus;
      const isFulfilled = status === "FULFILLED" || status === "PARTIALLY_FULFILLED";
      
      let dispatchDate = new Date(order.createdAt);
      let isDelivered = false;

      if (isFulfilled && order.fulfillments && order.fulfillments.length > 0) {
        const fulfillment = order.fulfillments[0];
        dispatchDate = new Date(fulfillment.createdAt);
        if (fulfillment.displayStatus === "DELIVERED") isDelivered = true;
      }

      const returnDeadline = new Date(dispatchDate);
      returnDeadline.setDate(returnDeadline.getDate() + 33);

      const now = new Date();
      const isPastWindow = now > returnDeadline;

      const items = order.lineItems.edges.map((e: any) => {
        const item = e.node;
        let returnStatus = "Eligible";

        if (!isFulfilled) returnStatus = "Not yet dispatched"; 
        else if (!isDelivered && !isPastWindow) returnStatus = "On its way"; 
        else if (isPastWindow) returnStatus = "Passed the return window"; 

        return { ...item, returnStatus };
      });

      return { ...order, processedItems: items };
    });

    return NextResponse.json({ firstName, orders: processedOrders });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
