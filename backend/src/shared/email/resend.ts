import { Resend } from "resend";
import { env } from "../../config/index.js";
import { logger } from "../../shared/logger/index.js";

const resend = new Resend(env.RESEND_API_KEY);

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Resend Email Dispatcher
 * Adheres to Decision #44 and Settly design tokens.
 * Handles Resend test mode recipient routing in development.
 */
export async function sendEmail({ to, subject, html, text }: EmailPayload): Promise<{ id?: string; error?: unknown }> {
  // In automated test environments, log and return early to prevent external network calls and quota burning
  if (env.NODE_ENV === "test" || env.RESEND_API_KEY.startsWith("re_ci_")) {
    logger.info({ to, subject }, "[Resend Mock] Email delivery skipped in test environment.");
    return { id: "test_email_id_" + Date.now() };
  }

  // Handle Resend onboarding sandbox constraint: only verified owner email can receive
  let recipient = to;
  if (env.EMAIL_FROM.includes("onboarding@resend.dev") && to !== "mohanedhatem44@gmail.com") {
    logger.warn(
      { originalTo: to, redirectedTo: "mohanedhatem44@gmail.com" },
      "[Resend Sandbox] Redirecting recipient to verified development email"
    );
    recipient = "mohanedhatem44@gmail.com";
  }

  try {
    const result = await resend.emails.send({
      from: env.EMAIL_FROM,
      to: [recipient],
      subject,
      html,
      text: text || subject,
    });

    if (result.error) {
      logger.error({ error: result.error, to: recipient, subject }, "[Resend] Email delivery failed");
      return { error: result.error };
    }

    logger.info({ id: result.data?.id, to: recipient, subject }, "[Resend] Email delivered successfully");
    return { id: result.data?.id };
  } catch (error) {
    logger.error({ error, to: recipient, subject }, "[Resend] Unexpected email delivery exception");
    return { error };
  }
}

/**
 * Settly Luxury Editorial Email Template Wrapper
 * Uses Settly colors: Deep Navy (#131D36, #1E2A4A), Brass (#C69749), Bone Canvas (#F7F6F3)
 */
function renderSettlyEmailTemplate({
  headline,
  preheader,
  bodyContent,
  ctaText,
  ctaUrl,
  footnote,
}: {
  headline: string;
  preheader: string;
  bodyContent: string;
  ctaText?: string;
  ctaUrl?: string;
  footnote?: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${headline}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #F7F6F3; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
    .wrapper { width: 100%; table-layout: fixed; background-color: #F7F6F3; padding: 40px 0; }
    .content { max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border: 1px solid rgba(30, 42, 74, 0.1); border-radius: 4px; overflow: hidden; }
    .header { background-color: #131D36; padding: 32px 40px; text-align: left; }
    .logo { color: #F6EEDE; font-size: 22px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; margin: 0; }
    .logo-brass { color: #C69749; }
    .body { padding: 40px; color: #16203A; line-height: 1.65; }
    .preheader { font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #AE8033; font-weight: 700; margin-bottom: 12px; }
    .headline { font-size: 26px; font-weight: 600; color: #131D36; margin: 0 0 24px 0; line-height: 1.3; font-family: Georgia, serif; }
    .text { font-size: 15px; color: #4C5878; margin-bottom: 24px; line-height: 1.7; }
    .btn-container { margin: 32px 0; }
    .btn { display: inline-block; background-color: #C69749; color: #0B111F; text-decoration: none; font-size: 14px; font-weight: 600; padding: 14px 28px; border-radius: 2px; letter-spacing: 0.05em; text-transform: uppercase; }
    .footnote { font-size: 13px; color: #646D88; border-top: 1px solid rgba(30, 42, 74, 0.08); padding-top: 24px; margin-top: 32px; }
    .footer { text-align: center; padding: 24px; font-size: 12px; color: #646D88; }
  </style>
</head>
<body>
  <div class="wrapper">
    <table class="content" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td class="header">
          <h1 class="logo">Settly<span class="logo-brass">.</span></h1>
        </td>
      </tr>
      <tr>
        <td class="body">
          <div class="preheader">${preheader}</div>
          <h2 class="headline">${headline}</h2>
          <div class="text">${bodyContent}</div>
          ${ctaUrl && ctaText ? `
          <div class="btn-container">
            <a href="${ctaUrl}" class="btn" target="_blank">${ctaText}</a>
          </div>
          <p class="text" style="font-size: 13px; word-break: break-all; color: #646D88;">
            Or copy and paste this link into your browser:<br>
            <a href="${ctaUrl}" style="color: #AE8033;">${ctaUrl}</a>
          </p>
          ` : ""}
          ${footnote ? `<div class="footnote">${footnote}</div>` : ""}
        </td>
      </tr>
      <tr>
        <td class="footer">
          &copy; ${new Date().getFullYear()} Settly Inc. Cairo, Egypt. Verified Real Estate Platform.
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
}

/**
 * Dispatch Email Verification Link
 */
export async function sendVerificationEmail({
  to,
  name,
  url,
}: {
  to: string;
  name?: string;
  url: string;
}): Promise<{ id?: string; error?: unknown }> {
  const html = renderSettlyEmailTemplate({
    headline: "Verify your email address",
    preheader: "Settly Sovereign Access",
    bodyContent: `Hello ${name || "Client"},<br><br>
    Welcome to Settly. Please confirm your email address to unlock scheduled viewings, offer submissions, and secure reservation deposits. Your search and shortlist privileges remain active immediately.`,
    ctaText: "Verify Email Address",
    ctaUrl: url,
    footnote: "This link expires in 24 hours. If you did not create a Settly account, you can safely ignore this email.",
  });

  return sendEmail({
    to,
    subject: "Verify your Settly account",
    html,
  });
}

/**
 * Dispatch Password Reset Link
 */
export async function sendPasswordResetEmail({
  to,
  name,
  url,
}: {
  to: string;
  name?: string;
  url: string;
}): Promise<{ id?: string; error?: unknown }> {
  const html = renderSettlyEmailTemplate({
    headline: "Reset your Settly password",
    preheader: "Security Verification",
    bodyContent: `Hello ${name || "Client"},<br><br>
    We received a request to reset your password for your Settly account. Click the button below to establish a new password. All other active sessions will be terminated upon reset.`,
    ctaText: "Reset Password",
    ctaUrl: url,
    footnote: "This link expires in 1 hour. If you did not request a password reset, please secure your account immediately.",
  });

  return sendEmail({
    to,
    subject: "Reset your Settly password",
    html,
  });
}
