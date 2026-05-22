// app/api/submit-return/route.ts
import { NextRequest, NextResponse } from "next/server";
import { parseSessionCookie, shopifyRequest } from "../_lib/shopify";
import { sendEmail } from "../_lib/mailjet";
import { getReturnConfirmationTemplate } from "../_lib/templates";

export async function POST(req: NextRequest) {
  try {
    // 1. Validate session structural authorization token parameters
    const session = parseSessionCookie(req);
    if (!session) {
      return NextResponse.json({ error: "Profile trace verification expired." }, { status: 401 });
    }

    const body = await req.json();
    const { orderId, items } = body;

    if (!orderId || !items || !Array.isArray(items)) {
      return NextResponse.json({ error: "Missing required return payload criteria fields." }, { status: 400 });
    }

    // 2. Initialise Shopify order modification rules to check constraints
    const query = `
      mutation orderEditBegin($id: ID!) {
        orderEditBegin(id: $id) {
          calculatedOrder { id }
        }
      }
    `;
    const beginData = await shopifyRequest(query, { id: `gid://shopify/Order/${orderId}` });
    const calcOrderId = beginData.orderEditBegin?.calculatedOrder?.id;

    if (!calcOrderId) {
      throw new Error("Shopify returned invalid formatting response on structural instantiation parameters.");
    }

    // 3. Compile custom HTML structural item list logs
    let itemsHtml = "<ul style='margin: 0; padding-left: 20px; font-size: 14px; color: #27272a;'>";
    items.forEach((item: any) => {
      itemsHtml += `<li style='margin-bottom: 6px;'>Line Item ID: <strong>${item.lineItemId}</strong> - Quantity: <strong>${item.quantity}</strong> (Reason: <em>${item.reason}</em>)</li>`;
    });
    itemsHtml += "</ul>";

    // 4. Send customer notification with custom formatting copy preferences
    const emailContent = getReturnConfirmationTemplate(session.sessionEmail, orderId, itemsHtml);
    await sendEmail({
      toEmail: session.sessionEmail,
      toName: "Customer",
      subject: `Your Return Request Confirmation: #${orderId}`,
      htmlContent: emailContent,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Return submission pipeline execution failure error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
