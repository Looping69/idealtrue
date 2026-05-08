import { secret } from "encore.dev/config";

const resendApiKey = secret("RESEND_API_KEY");
const authEmailFrom = secret("AUTH_EMAIL_FROM");
const authEmailReplyTo = secret("AUTH_EMAIL_REPLY_TO");
const idealStayAppUrl = secret("IDEAL_STAY_APP_URL");
const allowAuthEmailLogFallback = process.env.IDEAL_STAY_ALLOW_AUTH_EMAIL_LOG === "true";

type AuthEmailKind = "verify_email" | "reset_password";

function readConfiguredSecret(secretValue: () => string, name: string) {
  try {
    return secretValue().trim();
  } catch (error) {
    if (error instanceof Error && error.message === `secret ${name} is not set`) {
      return "";
    }
    throw error;
  }
}

function getAppUrl() {
  const configuredUrl = readConfiguredSecret(idealStayAppUrl, "IDEAL_STAY_APP_URL");
  if (configuredUrl) {
    return configuredUrl;
  }

  if (allowAuthEmailLogFallback) {
    return "http://localhost:3000";
  }

  throw new Error(
    "Auth email app URL is not configured. Set IDEAL_STAY_APP_URL so verification and reset links point at the frontend.",
  );
}

function renderAuthEmail(kind: AuthEmailKind, link: string, displayName: string) {
  if (kind === "verify_email") {
    return {
      subject: "Verify your Ideal Stay email",
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
          <h2>Verify your email</h2>
          <p>Hi ${displayName || "there"},</p>
          <p>Confirm your email address to secure your Ideal Stay account.</p>
          <p><a href="${link}" style="display:inline-block;padding:12px 18px;background:#0f766e;color:#fff;text-decoration:none;border-radius:8px">Verify email</a></p>
          <p>If the button does not work, use this link:</p>
          <p><a href="${link}">${link}</a></p>
        </div>
      `,
      text: `Verify your Ideal Stay email: ${link}`,
    };
  }

  return {
    subject: "Reset your Ideal Stay password",
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
        <h2>Reset your password</h2>
        <p>Hi ${displayName || "there"},</p>
        <p>Use the link below to set a new password for your Ideal Stay account.</p>
        <p><a href="${link}" style="display:inline-block;padding:12px 18px;background:#0f766e;color:#fff;text-decoration:none;border-radius:8px">Reset password</a></p>
        <p>If the button does not work, use this link:</p>
        <p><a href="${link}">${link}</a></p>
      </div>
    `,
    text: `Reset your Ideal Stay password: ${link}`,
  };
}

export async function sendAuthEmail(params: {
  to: string;
  displayName: string;
  kind: AuthEmailKind;
  token: string;
}) {
  const appUrl = getAppUrl().replace(/\/$/, "");
  const path =
    params.kind === "verify_email"
      ? `/signup?mode=verify-email&token=${encodeURIComponent(params.token)}`
      : `/signup?mode=reset-password&token=${encodeURIComponent(params.token)}`;
  const link = `${appUrl}${path}`;
  const rendered = renderAuthEmail(params.kind, link, params.displayName);

  return sendEmail({
    to: params.to,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
    logFallbackLabel: `auth-email:${params.kind}`,
    logFallbackValue: link,
  });
}

async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
  logFallbackLabel: string;
  logFallbackValue: string;
}) {
  const apiKey = readConfiguredSecret(resendApiKey, "RESEND_API_KEY");
  const from = readConfiguredSecret(authEmailFrom, "AUTH_EMAIL_FROM");
  const replyTo = readConfiguredSecret(authEmailReplyTo, "AUTH_EMAIL_REPLY_TO");
  if (!apiKey || !from) {
    if (!allowAuthEmailLogFallback) {
      throw new Error(
        "Auth email transport is not configured. Set RESEND_API_KEY and AUTH_EMAIL_FROM, or explicitly enable local log fallback with IDEAL_STAY_ALLOW_AUTH_EMAIL_LOG=true.",
      );
    }
    console.log(`[${params.logFallbackLabel}] ${params.to} -> ${params.logFallbackValue}`);
    return { delivery: "log" as const };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [params.to],
      subject: params.subject,
      html: params.html,
      text: params.text,
      reply_to: replyTo || undefined,
    }),
  });

  const body = await response.text();
  if (!response.ok) {
    throw new Error(`Failed to send email: ${response.status} ${body}`);
  }

  return { delivery: "resend" as const };
}

export async function sendHostVoucherEmail(params: {
  to: string;
  displayName: string;
  code: string;
  durationMonths: number;
}) {
  const durationLabel = params.durationMonths === 1 ? "1 month" : `${params.durationMonths} months`;
  const rendered = {
    subject: "Your Ideal Stay founding host voucher PIN",
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
        <h2>Your founding host voucher is ready</h2>
        <p>Hi ${params.displayName || "there"},</p>
        <p>Your email is verified and you qualify for a founding host voucher.</p>
        <p>This PIN gives you <strong>${durationLabel}</strong> of Standard host access once redeemed.</p>
        <div style="margin:20px 0;padding:16px 18px;border:1px solid #bae6fd;border-radius:12px;background:#f0f9ff;font-size:20px;font-weight:700;letter-spacing:0.18em">
          ${params.code}
        </div>
        <p>Sign in, open the pricing page, and redeem the PIN to activate your hosting period.</p>
      </div>
    `,
    text: `Your founding host voucher PIN is ${params.code}. Redeem it on the Ideal Stay pricing page to activate ${durationLabel} of Standard host access.`,
  };

  return sendEmail({
    to: params.to,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
    logFallbackLabel: "host-voucher-email",
    logFallbackValue: params.code,
  });
}
