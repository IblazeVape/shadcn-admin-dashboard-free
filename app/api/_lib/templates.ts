// app/api/_lib/templates.ts

/**
 * Generates the HTML layout for a successful return request registration.
 */
export function getReturnConfirmationTemplate(customerName: string, orderName: string, itemsListHtml: string) {
  return `
    <div style="font-family: sans-serif; padding: 20px; color: #111; max-width: 600px; margin: 0 auto; border: 1px solid #e4e4e7; border-radius: 12px;">
      <h2 style="font-size: 20px; font-weight: 700; margin-bottom: 10px;">Hi ${customerName},</h2>
      <p style="font-size: 14px; color: #3f3f46; line-height: 1.5;">We have successfully registered your return request for <strong>Order #${orderName}</strong>.</p>
      <div style="margin: 20px 0; padding: 15px; background-color: #f4f4f5; border: 1px solid #e4e4e7; border-radius: 8px;">
        <h4 style="margin-top: 0; margin-bottom: 10px; font-size: 14px; font-weight: 600;">Items requested for return:</h4>
        ${itemsListHtml}
      </div>
      <p style="font-size: 14px; color: #3f3f46; line-height: 1.5;">Please ensure your packages follow the required packaging constraints. We'll email you what we said earlier once it's been completed.</p>
    </div>
  `;
}

/**
 * Generates the HTML layout for a successfully filed transit or item fault claim.
 */
export function getClaimConfirmationTemplate(customerName: string, orderName: string, itemsListHtml: string) {
  return `
    <div style="font-family: sans-serif; padding: 20px; color: #111; max-width: 600px; margin: 0 auto; border: 1px solid #e4e4e7; border-radius: 12px;">
      <h2 style="font-size: 20px; font-weight: 700; margin-bottom: 10px;">Hi ${customerName},</h2>
      <p style="font-size: 14px; color: #3f3f46; line-height: 1.5;">Your claim has been recorded securely for <strong>Order #${orderName}</strong>.</p>
      <div style="margin: 20px 0; padding: 15px; background-color: #f4f4f5; border: 1px solid #e4e4e7; border-radius: 8px;">
        <h4 style="margin-top: 0; margin-bottom: 10px; font-size: 14px; font-weight: 600;">Claim item details:</h4>
        ${itemsListHtml}
      </div>
      <p style="font-size: 14px; color: #3f3f46; line-height: 1.5;">Our support operators are reviewing your uploaded evidence details. We'll email you what we said earlier once it's been completed.</p>
    </div>
  `;
}
