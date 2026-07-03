const nodemailer = require("nodemailer");
const { Resend } = require("resend");

/**
 * In development, Resend's free tier only allows sending to the account
 * owner's email (EMAIL_USER). We redirect all emails there by default.
 * Set BYPASS_DEV_REDIRECT=true in .env to send to actual student webmail accounts.
 */
const resolveRecipient = (originalEmail) => {
  if (process.env.NODE_ENV === "development" && process.env.BYPASS_DEV_REDIRECT !== "true") {
    const devRecipient = process.env.EMAIL_USER;
    console.log(
      `📧 [DEV] Redirecting email from ${originalEmail} → ${devRecipient}. Set BYPASS_DEV_REDIRECT=true in .env to send to actual address.`,
    );
    return devRecipient;
  }
  return originalEmail;
};

// Create Nodemailer Transporter for Gmail SMTP
const createNodemailerTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const sendOTPEmail = async (email, otp) => {
  const to = resolveRecipient(email);
  const subject = "Verify your CampusThrift account";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 12px;">
      <h2 style="color: #4f46e5; margin-bottom: 8px;">CampusThrift</h2>
      <p style="color: #6b7280; font-size: 14px;">NITT Student Platform</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      ${process.env.NODE_ENV === "development" && process.env.BYPASS_DEV_REDIRECT !== "true" ? `<p style="background:#fef9c3;padding:8px 12px;border-radius:6px;font-size:13px;color:#92400e;">⚠️ DEV REDIRECT MODE — originally for: <strong>${email}</strong></p>` : ""}
      <p style="color: #374151;">Your email verification code is:</p>
      <div style="background: #eef2ff; border-radius: 8px; padding: 24px; text-align: center; margin: 16px 0;">
        <h1 style="letter-spacing: 12px; color: #4f46e5; font-size: 36px; margin: 0;">${otp}</h1>
      </div>
      <p style="color: #6b7280; font-size: 14px;">This code expires in <strong>10 minutes</strong>.</p>
      <p style="color: #6b7280; font-size: 14px;">If you did not request this, please ignore this email.</p>
    </div>
  `;

  if (process.env.EMAIL_SERVICE === "nodemailer") {
    const transporter = createNodemailerTransporter();
    await transporter.sendMail({
      from: `"CampusThrift" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`✉️ OTP email sent to ${to} via Gmail SMTP.`);
  } else if (process.env.EMAIL_SERVICE === "brevo") {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": process.env.BREVO_API_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: "CampusThrift", email: process.env.EMAIL_USER },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
    });
    if (!response.ok) {
      const errData = await response.json();
      throw new Error(`Brevo HTTP failed: ${errData.message || response.statusText}`);
    }
    console.log(`✉️ OTP email sent to ${to} via Brevo HTTP API.`);
  } else {
    // Default to Resend
    const resend = new Resend(process.env.RESEND_API_KEY);
    const fromAddress = process.env.RESEND_FROM_ADDRESS || "CampusThrift <onboarding@resend.dev>";
    const { error } = await resend.emails.send({
      from: fromAddress,
      to,
      subject,
      html,
    });
    if (error) {
      throw new Error(`Resend email failed: ${error.message}`);
    }
    console.log(`✉️ OTP email sent to ${to} via Resend.`);
  }
};

const sendResetPasswordEmail = async (email, otp) => {
  const to = resolveRecipient(email);
  const subject = "Reset your CampusThrift password";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 12px;">
      <h2 style="color: #4f46e5; margin-bottom: 8px;">CampusThrift</h2>
      <p style="color: #6b7280; font-size: 14px;">Password Recovery System</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      ${process.env.NODE_ENV === "development" && process.env.BYPASS_DEV_REDIRECT !== "true" ? `<p style="background:#fef9c3;padding:8px 12px;border-radius:6px;font-size:13px;color:#92400e;">⚠️ DEV REDIRECT MODE — originally for: <strong>${email}</strong></p>` : ""}
      <p style="color: #374151;">Your password recovery verification code is:</p>
      <div style="background: #fef2f2; border-radius: 8px; padding: 24px; text-align: center; margin: 16px 0;">
        <h1 style="letter-spacing: 12px; color: #ef4444; font-size: 36px; margin: 0;">${otp}</h1>
      </div>
      <p style="color: #6b7280; font-size: 14px;">This code expires in <strong>10 minutes</strong>.</p>
      <p style="color: #6b7280; font-size: 14px;">If you did not request this, please ignore this email. Your password will remain unchanged.</p>
    </div>
  `;

  if (process.env.EMAIL_SERVICE === "nodemailer") {
    const transporter = createNodemailerTransporter();
    await transporter.sendMail({
      from: `"CampusThrift" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`✉️ Reset password email sent to ${to} via Gmail SMTP.`);
  } else if (process.env.EMAIL_SERVICE === "brevo") {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": process.env.BREVO_API_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: "CampusThrift", email: process.env.EMAIL_USER },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
    });
    if (!response.ok) {
      const errData = await response.json();
      throw new Error(`Brevo HTTP failed: ${errData.message || response.statusText}`);
    }
    console.log(`✉️ Reset password email sent to ${to} via Brevo HTTP API.`);
  } else {
    // Default to Resend
    const resend = new Resend(process.env.RESEND_API_KEY);
    const fromAddress = process.env.RESEND_FROM_ADDRESS || "CampusThrift <onboarding@resend.dev>";
    const { error } = await resend.emails.send({
      from: fromAddress,
      to,
      subject,
      html,
    });
    if (error) {
      throw new Error(`Resend email failed: ${error.message}`);
    }
    console.log(`✉️ Reset password email sent to ${to} via Resend.`);
  }
};

module.exports = { sendOTPEmail, sendResetPasswordEmail };
