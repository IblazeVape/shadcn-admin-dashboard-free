// app/api/_lib/mailjet.ts

interface SendEmailPayload {
  toEmail: string;
  toName: string;
  subject: string;
  htmlContent: string;
}

/**
 * Dispatches a transactional email alert via the Mailjet Send API v3.1
 */
export async function sendEmail({ toEmail, toName, subject, htmlContent }: SendEmailPayload) {
  const apiKey = process.env.MAILJET_API_KEY;
  const apiSecret = process.env.MAILJET_SECRET_KEY;
  const fromEmail = process.env.MAILJET_FROM_EMAIL || "support@iblazevape.co.uk";

  if (!apiKey || !apiSecret) {
    throw new Error("Missing Mailjet configuration credentials inside environment variables.");
  }

  const credentials = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");

  const response = await fetch("https://api.mailjet.com/v3.1/send", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${credentials}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      Messages: [
        {
          From: {
            Email: fromEmail,
            Name: "iBlaze Vape Returns",
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
    const errorText = await response.text();
    throw new Error(`Mailjet delivery pipeline failed execution: ${errorText}`);
  }

  return response.json();
}
