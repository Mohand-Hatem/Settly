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
export async function sendEmail({
  to,
  subject,
  html,
  text,
}: EmailPayload): Promise<{ id?: string; error?: unknown }> {
  // In automated test environments, log and return early to prevent external network calls and quota burning
  if (env.NODE_ENV === "test" || env.RESEND_API_KEY.startsWith("re_ci_")) {
    logger.info(
      { to, subject },
      "[Resend Mock] Email delivery skipped in test environment.",
    );
    return { id: "test_email_id_" + Date.now() };
  }

  // Handle Resend onboarding sandbox constraint: only verified owner email can receive
  let recipient = to;
  if (
    env.EMAIL_FROM.includes("onboarding@resend.dev") &&
    to !== "mohanedhatem44@gmail.com"
  ) {
    logger.warn(
      { originalTo: to, redirectedTo: "mohanedhatem44@gmail.com" },
      "[Resend Sandbox] Redirecting recipient to verified development email",
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
      logger.error(
        { error: result.error, to: recipient, subject },
        "[Resend] Email delivery failed",
      );
      return { error: result.error };
    }

    logger.info(
      { id: result.data?.id, to: recipient, subject },
      "[Resend] Email delivered successfully",
    );
    return { id: result.data?.id };
  } catch (error) {
    logger.error(
      { error, to: recipient, subject },
      "[Resend] Unexpected email delivery exception",
    );
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
  code,
  ctaText,
  ctaUrl,
  footnote,
}: {
  headline: string;
  preheader: string;
  bodyContent: string;
  code?: string;
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
    .content { max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border: 1px solid rgba(30, 42, 74, 0.1); border-radius: 8px; overflow: hidden; box-shadow: 0 4px 16px rgba(19, 29, 54, 0.05); }
    .header { background-color: #0B111F; padding: 24px 36px; border-bottom: 2px solid #C69749; }
    .body { padding: 36px 40px; color: #16203A; line-height: 1.65; }
    .preheader { font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #AE8033; font-weight: 700; margin-bottom: 12px; }
    .headline { font-size: 26px; font-weight: 600; color: #131D36; margin: 0 0 20px 0; line-height: 1.3; font-family: Georgia, serif; }
    .text { font-size: 14.5px; color: #4C5878; margin-bottom: 20px; line-height: 1.7; }
    .btn-container { text-align: center; margin: 30px 0 20px 0; }
    .btn { display: inline-block; background-color: #C69749; color: #0B111F; text-decoration: none; font-size: 13.5px; font-weight: 700; padding: 13px 30px; border-radius: 4px; letter-spacing: 0.05em; text-transform: uppercase; }
    .footnote { font-size: 12.5px; color: #757E95; border-top: 1px solid rgba(30, 42, 74, 0.08); padding-top: 20px; margin-top: 28px; line-height: 1.5; }
    .footer { text-align: center; padding: 20px; font-size: 11.5px; color: #757E95; }
  </style>
</head>
<body>
  <div class="wrapper">
    <table class="content" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td class="header">
          <table cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="vertical-align: middle; padding-right: 12px;">
                <img src="https://res.cloudinary.com/dmzcnnxzp/image/upload/v1789545905/Logo_dxbtth.jpg" alt="Settly Logo" width="34" height="34" style="display: block; width: 34px; height: 34px; border: 0; outline: none;" />
              </td>
              <td style="vertical-align: middle;">
                <span style="color: #FFFFFF; font-size: 22px; font-weight: 800; letter-spacing: -0.02em; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Settly<span style="color: #C69749;">.</span></span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td class="body">
          <div class="preheader">${preheader}</div>
          <h2 class="headline">${headline}</h2>
          <div class="text">${bodyContent}</div>
          
          ${
            code
              ? `
          <div style="background-color: #F7F6F3; border: 1px solid rgba(30, 42, 74, 0.14); border-radius: 8px; padding: 24px 16px; text-align: center; margin: 26px 0;">
            <div style="font-family: ui-monospace, 'SFMono-Regular', Menlo, Monaco, Consolas, monospace; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: #4C5878; margin-bottom: 8px;">
              CRYPTOGRAPHIC VERIFICATION CODE
            </div>
            <div style="font-family: ui-monospace, 'SFMono-Regular', Menlo, Monaco, Consolas, monospace; font-size: 38px; font-weight: 700; letter-spacing: 12px; color: #131D36; padding: 4px 0 6px 12px;">
              ${code}
            </div>
            <div style="font-family: ui-monospace, 'SFMono-Regular', Menlo, Monaco, Consolas, monospace; font-size: 11px; color: #3D5A4C; font-weight: 600; margin-top: 6px;">
              🔒 15-MIN TTL · SINGLE-USE TOKEN
            </div>
          </div>
          `
              : ""
          }

          ${
            ctaUrl && ctaText
              ? `
          <div class="btn-container">
            <p style="font-size: 13px; color: #646D88; margin-bottom: 14px;">
              Or verify automatically with a single click:
            </p>
            <a href="${ctaUrl}" class="btn" target="_blank">${ctaText}</a>
          </div>
          <p class="text" style="font-size: 12px; word-break: break-all; color: #757E95; text-align: center; margin-top: 16px;">
            Direct link: <a href="${ctaUrl}" style="color: #AE8033; text-decoration: underline;">${ctaUrl}</a>
          </p>
          `
              : ""
          }
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
  code,
}: {
  to: string;
  name?: string;
  url: string;
  code?: string;
}): Promise<{ id?: string; error?: unknown }> {
  const html = renderSettlyEmailTemplate({
    headline: "Verify your email address",
    preheader: "Settly Sovereign Access",
    bodyContent: `Hello ${name || "Client"},<br><br>
    Welcome to Settly. Please enter the 6-digit cryptographic verification code below in your browser, or click the direct button to activate your account.`,
    code,
    ctaText: "Verify Email Address",
    ctaUrl: url,
    footnote:
      "This code expires in 15 minutes. If you did not create a Settly account, you can safely ignore this email.",
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
    footnote:
      "This link expires in 1 hour. If you did not request a password reset, please secure your account immediately.",
  });

  return sendEmail({
    to,
    subject: "Reset your Settly password",
    html,
  });
}
