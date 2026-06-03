import smtplib
import os
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

# ── Gmail Configuration ────────────────────────────────────────────────────────
# Set these in your .env file:
#   GMAIL_ADDRESS=yourbarangay@gmail.com
#   GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx  ← Google App Password (not your regular password)
#   FRONTEND_URL=http://localhost:3000       ← Change to Railway URL when deployed

GMAIL_ADDRESS = os.getenv("GMAIL_USER", "") or os.getenv("GMAIL_ADDRESS", "")
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD", "")
FRONTEND_URL      = os.getenv("FRONTEND_URL", "http://localhost:3000")
SYSTEM_NAME       = "Barangay Sto. Niño Budget Tracking System"


def send_password_reset_email(
    to_email: str,
    full_name: str,
    reset_token: str,
    expires_minutes: int = 30,
):
    if not GMAIL_ADDRESS or not GMAIL_APP_PASSWORD:
        print(f"[EMAIL] Gmail not configured. Reset token for {to_email}: {reset_token}")
        return

    reset_link = f"{FRONTEND_URL}/reset-password?token={reset_token}"

    # ── HTML Email Template ────────────────────────────────────────────────────
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;background-color:#0e1a12;font-family:'Segoe UI',Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0e1a12;padding:40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color:#122018;border-radius:16px;border:1px solid #2f5238;overflow:hidden;max-width:600px;">

              <!-- Header -->
              <tr>
                <td style="background:linear-gradient(135deg,#0a1a0c,#0f2414);padding:40px 40px 30px;text-align:center;border-bottom:2px solid #c49c40;">
                  <div style="font-size:48px;margin-bottom:16px;">🏛️</div>
                  <h1 style="color:#ffffff;font-size:22px;font-weight:700;margin:0 0 6px;">Barangay Sto. Niño</h1>
                  <p style="color:#c49c40;font-size:13px;margin:0;">Parañaque City, Metro Manila</p>
                  <p style="color:#6e8872;font-size:12px;margin:4px 0 0;">Budget Tracking System</p>
                </td>
              </tr>

              <!-- Gold divider -->
              <tr>
                <td style="height:3px;background:linear-gradient(90deg,transparent,#c49c40,transparent);"></td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding:40px;">
                  <h2 style="color:#ffffff;font-size:20px;font-weight:600;margin:0 0 16px;">Password Reset Request</h2>
                  <p style="color:#b8c4bb;font-size:14px;line-height:1.7;margin:0 0 24px;">
                    Hello, <strong style="color:#ffffff;">{full_name}</strong>!
                  </p>
                  <p style="color:#b8c4bb;font-size:14px;line-height:1.7;margin:0 0 24px;">
                    We received a request to reset your password for your account on the
                    <strong style="color:#e8c060;">{SYSTEM_NAME}</strong>.
                    Click the button below to set a new password.
                  </p>

                  <!-- Reset Button -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center" style="padding:10px 0 30px;">
                        <a href="{reset_link}"
                           style="display:inline-block;background:linear-gradient(135deg,#c49c40,#a8832e);color:#0e1a12;font-weight:700;font-size:15px;text-decoration:none;padding:14px 40px;border-radius:8px;border:1px solid #e8c060;letter-spacing:0.3px;">
                          🔐 Reset My Password
                        </a>
                      </td>
                    </tr>
                  </table>

                  <!-- Warning box -->
                  <div style="background:rgba(196,156,64,0.08);border:1px solid rgba(196,156,64,0.25);border-radius:10px;padding:16px 20px;margin-bottom:24px;">
                    <p style="color:#e8c060;font-size:13px;font-weight:600;margin:0 0 6px;">⏰ Important</p>
                    <p style="color:#b8c4bb;font-size:13px;margin:0;line-height:1.6;">
                      This link will expire in <strong style="color:#ffffff;">{expires_minutes} minutes</strong>.
                      If you did not request a password reset, please ignore this email —
                      your account remains secure.
                    </p>
                  </div>

                  <!-- Manual link -->
                  <p style="color:#6e8872;font-size:12px;margin:0 0 8px;">If the button doesn't work, copy and paste this link:</p>
                  <p style="background:#0e1a12;border:1px solid #2f5238;border-radius:6px;padding:10px 14px;margin:0;word-break:break-all;">
                    <a href="{reset_link}" style="color:#c49c40;font-size:12px;font-family:monospace;text-decoration:none;">{reset_link}</a>
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background:#0a1a0c;padding:24px 40px;border-top:1px solid #243d2a;text-align:center;">
                  <p style="color:#6e8872;font-size:12px;margin:0 0 4px;">
                    This is an automated message from the {SYSTEM_NAME}.
                  </p>
                  <p style="color:#6e8872;font-size:12px;margin:0;">
                    Barangay Sto. Niño, Parañaque City · Republic of the Philippines
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    """

    # ── Plain text fallback ────────────────────────────────────────────────────
    plain = f"""
Password Reset Request — {SYSTEM_NAME}

Hello {full_name},

We received a request to reset your password.
Click the link below to set a new password (expires in {expires_minutes} minutes):

{reset_link}

If you did not request this, ignore this email — your account is safe.

— Barangay Sto. Niño Budget Tracking System
    """

    # ── Send via Gmail SMTP ────────────────────────────────────────────────────
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"🔐 Password Reset — {SYSTEM_NAME}"
        msg["From"]    = f"Barangay Sto. Niño Budget System <{GMAIL_ADDRESS}>"
        msg["To"]      = to_email

        msg.attach(MIMEText(plain, "plain"))
        msg.attach(MIMEText(html,  "html"))

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(GMAIL_ADDRESS, GMAIL_APP_PASSWORD)
            server.sendmail(GMAIL_ADDRESS, to_email, msg.as_string())

        print(f"[EMAIL] ✅ Password reset email sent to {to_email}")

    except smtplib.SMTPAuthenticationError:
        print("[EMAIL] ❌ Gmail authentication failed. Check GMAIL_ADDRESS and GMAIL_APP_PASSWORD in .env")
    except smtplib.SMTPException as e:
        print(f"[EMAIL] ❌ SMTP error: {e}")
    except Exception as e:
        print(f"[EMAIL] ❌ Unexpected error: {e}")