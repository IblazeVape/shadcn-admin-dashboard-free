// app/api/_lib/mailjet.ts

/**
 * Sends a transactional email message using Mailjet's send API.
 * Uses securely configured credentials from your Vercel project settings.
 */
export async function sendEmail({
  toEmail,
  toName,
  subject,
  htmlContent,
}: {
  toEmail: string;
  toName: string;
  subject: string;
  htmlContent: string;
}) {
  const apiKey = process.env.MAILJET_API_KEY;
  const apiSecret = process.env.MAILJET_SECRET_KEY;

  if (!apiKey || !apiSecret) {
    console.warn("Mailjet configurations are missing from your Vercel project settings. Email skipped.");
    return;
  }

  const base64Credentials = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");

  try {
    const response = await fetch("https://api.mailjet.com/v3.1/send", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${base64Credentials}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        Messages: [
          {
            From: {
              Email: "support@iblazevape.co.uk",
              Name: "iBlaze Support",
            },
            To: [
              {
                Email: toEmail,
                Name: toName,
              },
            ],
            Subject: subject,
            HTMLPart: htmlContent,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Mailjet API Error response:", errText);
    }
  } catch (error) {
    console.error("Failed to execute Mailjet request dispatch:", error);
  }
}
