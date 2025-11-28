import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
      console.warn('[email] SMTP credentials are missing. Emails will not be sent.');
    }

    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: user && pass ? { user, pass } : undefined,
    });
  }
  return transporter!;
}

export async function sendEmail(options: {
  to: string[];
  subject: string;
  text?: string;
  html?: string;
}) {
  const fromEmail = process.env.SMTP_FROM_EMAIL || 'noreply@example.com';
  const fromName = process.env.SMTP_FROM_NAME || 'Charming.by';

  try {
    const tx = getTransporter();
    if (!options.to?.length) {
      console.warn('[email] No recipients provided, skipping send.');
      return;
    }

    await tx.sendMail({
      from: `${fromName} <${fromEmail}>`,
      to: options.to.join(', '),
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
  } catch (err) {
    console.error('[email] Failed to send email:', err);
  }
}
