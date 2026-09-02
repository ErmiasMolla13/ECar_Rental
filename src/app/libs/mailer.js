import { BrevoClient } from '@getbrevo/brevo';

let brevoClient = null;

function getBrevoClient() {
  if (brevoClient) return brevoClient;
  if (!process.env.BREVO_API_KEY) return null;

  brevoClient = new BrevoClient({ apiKey: process.env.BREVO_API_KEY });
  return brevoClient;
}

/**
 * Sends an email via Brevo (formerly Sendinblue), or - if BREVO_API_KEY isn't
 * configured (e.g. local dev) - logs it to the console instead of failing.
 * This means email verification and password reset are usable out of the
 * box in development without requiring a real Brevo account; set
 * BREVO_API_KEY and SENDER_EMAIL in production to actually deliver mail.
 */
export async function sendMail({ to, subject, html }) {
  const client = getBrevoClient();

  if (!client) {
    console.warn(
      `[mailer] BREVO_API_KEY not configured - printing email instead of sending it.\n` +
      `To: ${to}\nSubject: ${subject}\n${html}\n`
    );
    return { delivered: false, reason: 'BREVO_API_KEY not configured' };
  }

  const senderEmail = process.env.SENDER_EMAIL;
  if (!senderEmail) {
    console.warn(
      `[mailer] SENDER_EMAIL not configured - printing email instead of sending it.\n` +
      `To: ${to}\nSubject: ${subject}\n${html}\n`
    );
    return { delivered: false, reason: 'SENDER_EMAIL not configured' };
  }

  try {
    await client.transactionalEmails.sendTransacEmail({
      subject,
      htmlContent: html,
      sender: {
        name: process.env.SENDER_NAME || 'Er-Car Rentals',
        email: senderEmail,
      },
      to: [{ email: to }],
    });
    return { delivered: true };
  } catch (error) {
    // Brevo's SDK throws typed errors (UnauthorizedError, BadRequestError,
    // etc.) with the useful detail on the error itself.
    console.error('[mailer] Brevo send failed:', error?.body || error?.message || error);
    throw error;
  }
}

export function baseUrl() {
  return process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}
