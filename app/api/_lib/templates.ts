// app/api/_lib/templates.ts

/**
 * Generates a clean HTML structure for standard unwanted item returns
 */
export function getReturnConfirmationTemplate(email: string, orderId: string, itemsHtml: string): string {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e4e4e7; rounded-xl: 12px;">
      <h2 style="color: #18181b; font-size: 20px; margin-bottom: 8px;">Return Request Received</h2>
      <p style="color: #71717a; font-size: 14px; line-height: 1.5;">Hello,</p>
      <p style="color: #71717a; font-size: 14px; line-height: 1.5;">We have successfully logged your standard return request for order <strong>#${orderId}</strong>.</p>
      
      <div style="background-color: #f4f4f5; border: 1px solid #e4e4e7; padding: 16px; margin: 20px 0; borderRadius: 8px;">
        <h3 style="margin-top: 0; font-size: 14px; color: #18181b;">Items Selected for Return:</h3>
        ${itemsHtml}
      </div>

      <p style="color: #18181b; font-size: 14px; font-weight: 500; background-color: #fafafa; border: 1px solid #e4e4e7; padding: 12px; border-radius: 6px;">
        Please review what we said earlier for your next steps, packaging criteria guidelines, and dispatch address details.
      </p>
      
      <p style="color: #a1a1aa; font-size: 12px; margin-top: 24px; border-top: 1px solid #e4e4e7; padding-top: 12px;">
        iBlaze Vape Returns Framework Portal System.
      </p>
    </div>
  `;
}

/**
 * Generates a clean HTML structure for broken, damaged, or missing item claims
 */
export function getClaimConfirmationTemplate(email: string, orderId: string, itemsHtml: string): string {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e4e4e7; rounded-xl: 12px;">
      <h2 style="color: #18181b; font-size: 20px; margin-bottom: 8px;">Claim Ticket Created</h2>
      <p style="color: #71717a; font-size: 14px; line-height: 1.5;">Hello,</p>
      <p style="color: #71717a; font-size: 14px; line-height: 1.5;">A formal claim ticket has been filed against order <strong>#${orderId}</strong> and is undergoing verification review.</p>
      
      <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; padding: 16px; margin: 20px 0; borderRadius: 8px;">
        <h3 style="margin-top: 0; font-size: 14px; color: #1e3a8a;">Claim Details:</h3>
        ${itemsHtml}
      </div>

      <p style="color: #18181b; font-size: 14px; font-weight: 500; background-color: #fafafa; border: 1px solid #e4e4e7; padding: 12px; border-radius: 6px;">
        Our team will investigate this claim profile. Please review what we said earlier to monitor progress milestones.
      </p>
      
      <p style="color: #a1a1aa; font-size: 12px; margin-top: 24px; border-top: 1px solid #e4e4e7; padding-top: 12px;">
        iBlaze Vape Claims Evaluation System.
      </p>
    </div>
  `;
}
