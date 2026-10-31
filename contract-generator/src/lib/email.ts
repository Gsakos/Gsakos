import { Resend } from "resend";

const FROM = process.env.EMAIL_FROM || "DealSeal <onboarding@resend.dev>";

function getClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

export const emailIsConfigured = (): boolean => Boolean(process.env.RESEND_API_KEY);

interface SigningRequestEmailInput {
  to: string;
  partyName: string;
  contractTitle: string;
  signingUrl: string;
  otherPartyNames: string[];
}

export async function sendSigningRequestEmail(input: SigningRequestEmailInput): Promise<void> {
  const client = getClient();
  if (!client) return; // email not configured - caller surfaces the signing link in-app instead

  const others = input.otherPartyNames.length
    ? `This agreement also involves ${input.otherPartyNames.join(" and ")}.`
    : "";

  await client.emails.send({
    from: FROM,
    to: input.to,
    subject: `Please sign: ${input.contractTitle}`,
    html: `
      <div style="font-family: -apple-system, Segoe UI, Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
        <h2 style="margin-bottom: 4px;">${escapeHtml(input.contractTitle)}</h2>
        <p>Hi ${escapeHtml(input.partyName)},</p>
        <p>You've been asked to review and sign the agreement above. ${escapeHtml(others)}</p>
        <p style="margin: 24px 0;">
          <a href="${input.signingUrl}" style="background: #111827; color: #ffffff; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: 600;">
            Review &amp; sign
          </a>
        </p>
        <p style="color: #6b7280; font-size: 13px;">If the button doesn't work, copy this link into your browser:<br />${input.signingUrl}</p>
        <p style="color: #6b7280; font-size: 13px;">This document was drafted with AI assistance and has not been reviewed by an attorney.</p>
      </div>
    `,
  });
}

interface FullyExecutedEmailInput {
  to: string;
  partyName: string;
  contractTitle: string;
  viewUrl: string;
}

export async function sendFullyExecutedEmail(input: FullyExecutedEmailInput): Promise<void> {
  const client = getClient();
  if (!client) return;

  await client.emails.send({
    from: FROM,
    to: input.to,
    subject: `Fully signed: ${input.contractTitle}`,
    html: `
      <div style="font-family: -apple-system, Segoe UI, Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
        <h2 style="margin-bottom: 4px;">${escapeHtml(input.contractTitle)}</h2>
        <p>Hi ${escapeHtml(input.partyName)},</p>
        <p>Everyone has now signed. The fully executed agreement is ready to view and download.</p>
        <p style="margin: 24px 0;">
          <a href="${input.viewUrl}" style="background: #111827; color: #ffffff; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: 600;">
            View signed agreement
          </a>
        </p>
        <p style="color: #6b7280; font-size: 13px;">If the button doesn't work, copy this link into your browser:<br />${input.viewUrl}</p>
      </div>
    `,
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
