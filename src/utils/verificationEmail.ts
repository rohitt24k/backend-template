import { FRONTEND_URL } from "../config/app-config";
import { sendEmail } from "../lib/email";
import { TOKEN_EXPIRY } from "./constants";
import { formatDuration } from "./formatDuration";

export async function sendEmailVerification({
  email,
  token,
}: {
  email: string;
  token: string;
}) {
  const verifyUrl = `${FRONTEND_URL}/verify-email?token=${token}`;

  await sendEmail({
    to: email,
    subject: "Verify your email address",
    html: `
      <p>Welcome 👋</p>
      <p>Please verify your email by clicking the link below:</p>
      <a href="${verifyUrl}">${verifyUrl}</a>
      <p>This link will expire in <b>${formatDuration(
        TOKEN_EXPIRY.EMAIL_VERIFICATION,
      )}</b>.</p>
    `,
  });
}
