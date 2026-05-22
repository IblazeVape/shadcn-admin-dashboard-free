// app/api/submit-claim/route.ts
import { NextRequest, NextResponse } from "next/server";
import { parseSessionCookie } from "../_lib/shopify";
import { sendEmail } from "../_lib/mailjet";
import { getClaimConfirmationTemplate } from "../_lib/templates";

export async function POST(req: NextRequest) {
  try {
    // 1. Enforce session structural authorization validation metrics
    const session = parseSessionCookie(req);
    if (!session) {
      return NextResponse.json({ error: "Profile trace verification expired." }, { status: 401 });
    }

    const body = await req.json();
    const { orderId, items } = body;

    if (!orderId || !items || !Array.isArray(items)) {
      return NextResponse.json({ error: "Missing required claim payload criteria fields." }, { status: 400 });
    }

    // 2. Build items list visualization template structure mapping parameters
    let itemsHtml = "<ul style='margin: 0; padding-left: 20px; font-size: 14px; color: #27272a;'>";
    items.forEach((item: any) => {
      const descriptionText = item.description ? ` - Description: <em>"${item.description}"</em>` : "";
      itemsHtml += `<li style='margin-bottom: 6px;'>Product: <strong>${item.lineItemId}</strong> x <strong>${item.quantity}</strong> - Reason: <strong>${item.reason}</strong>${descriptionText}</li>`;
    });
    itemsHtml += "</ul>";

    // 3. Dispatch verification alerts utilizing your custom transactional email template configurations
    const emailContent = getClaimConfirmationTemplate(session.sessionEmail, orderId, itemsHtml);
    await sendEmail({
      toEmail: session.sessionEmail,
      toName: "Customer",
      subject: `Your iBlaze Claim Submission Filed: #${orderId}`,
      htmlContent: emailContent,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Claim submission pipeline error execution failure:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
