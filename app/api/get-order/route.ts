// app/api/get-order/route.ts
import { NextRequest, NextResponse } from "next/server";
import { shopifyRequest, parseSessionCookie } from "../_lib/shopify";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  try {
    // 1. Session verification trace parsing
    const session = parseSessionCookie(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorised profile context state." }, { status: 401 });
    }

    const portalSecret = process.env.PORTAL_SECRET;
    const expectedSig = crypto
      .createHmac("sha256", portalSecret || "")
      .update(`${session.sessionEmail}|${session.accessToken}|${session.expiryTime}`)
      .digest("hex");

    if (session.sessionSig !== expectedSig) {
      return NextResponse.json({ error: "Session verification mismatch token rules." }, { status: 403 });
    }

    // 2. Locate target request parameter identifiers
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");
    if (!orderId) {
      return NextResponse.json({ error: "Order context configuration target identifier missing." }, { status: 400 });
    }

    const graphqlOrderId = `gid://shopify/Order/${orderId}`;
    
    // Explicit structural GraphQL fields query layout mapping criteria
    const query = `
      query GetOrderDetails($id: ID!) {
        node(id: $id) {
          ... on Order {
            id name createdAt displayFulfillmentStatus 
            totalRefundedSet { shopMoney { amount } } 
            totalPriceSet { shopMoney { amount } }
            lineItems(first: 50) {
              edges {
                node {
                  id title quantity variantTitle variant { id } product { handle }
                  image { url }
                }
              }
            }
          }
        }
      }
    `;

    const data = await shopifyRequest(query, { id: graphqlOrderId });
    const order = data.node;
    if (!order) {
      return NextResponse.json({ error: "Order details query returned null matching data fields." }, { status: 404 });
    }

    const totalRefunded = parseFloat(order.totalRefundedSet?.shopMoney?.amount || "0");
    const totalPrice = parseFloat(order.totalPriceSet?.shopMoney?.amount || "0");

    const eligibleItems: any[] = [];
    const ineligibleItems: any[] = [];

    // 3. Process item conditions maps using specific UK dispatch labels
    order.lineItems.edges.forEach((edge: any) => {
      const item = edge.node;
      const payload = {
        id: item.id,
        title: item.title,
        variantTitle: item.variantTitle,
        image: item.image?.url || "",
        price: (totalPrice / item.quantity).toString(), 
        quantityAvailable: item.quantity,
        handle: item.product?.handle || "",
      };

      if (order.displayFulfillmentStatus !== "FULFILLED") {
        ineligibleItems.push({ 
          ...payload, 
          quantity: item.quantity, 
          reason: "Item has not yet been dispatched." 
        });
      } else {
        eligibleItems.push(payload);
      }
    });

    return NextResponse.json({
      orderSummary: {
        id: order.id,
        name: order.name,
        createdAt: order.createdAt,
        isDelivered: order.displayFulfillmentStatus === "FULFILLED",
        totalRefunded: totalRefunded.toString(),
        totalPrice: totalPrice.toString(),
      },
      eligibleItems,
      ineligibleItems,
      totalIneligibleCount: ineligibleItems.length,
      ineligibleBannerMessage: ineligibleItems.length > 0 ? "Some items in this order are currently ineligible for return" : "",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
