"""
Email service using Resend.

All transactional emails are bilingual (English + Traditional Chinese).
Every email footer includes the regulatory disclaimer.
"""
import logging
import resend
from app.config import settings

logger = logging.getLogger(__name__)

_DISCLAIMER_EN = (
    "RWA-Index is an academic research tool, not a credit rating service. "
    "It does not hold a Securities and Futures Commission licence or any other "
    "regulated financial services licence."
)
_DISCLAIMER_ZH = (
    "RWA-Index 是學術研究工具，並非信用評級服務，"
    "未持有證券及期貨事務監察委員會牌照或任何其他受規管金融服務牌照。"
)

_BASE_STYLE = """
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
         background: #0F1117; color: #e2e8f0; margin: 0; padding: 0; }
  .wrap { max-width: 560px; margin: 40px auto; background: #1A1A2E;
          border: 1px solid #2B3437; border-radius: 8px; overflow: hidden; }
  .header { padding: 28px 32px; border-bottom: 1px solid #2B3437; }
  .brand { font-size: 18px; font-weight: 700; color: #fff; letter-spacing: -0.3px; }
  .subtitle { font-size: 10px; text-transform: uppercase; letter-spacing: 2px;
              color: #5E5C75; margin-top: 2px; }
  .body { padding: 28px 32px; }
  h2 { font-size: 16px; font-weight: 700; color: #fff; margin: 0 0 8px; }
  p { font-size: 14px; line-height: 1.6; color: #94a3b8; margin: 0 0 14px; }
  .cta { display: inline-block; background: #5E5C75; color: #fff !important;
         font-weight: 700; font-size: 14px; padding: 12px 24px; border-radius: 6px;
         text-decoration: none; margin: 8px 0 20px; }
  .divider { border: none; border-top: 1px solid #2B3437; margin: 20px 0; }
  .zh { color: #64748b; font-size: 13px; line-height: 1.7; }
  .footer { padding: 16px 32px; border-top: 1px solid #2B3437;
            font-size: 11px; color: #475569; line-height: 1.6; }
  .status-badge { display: inline-block; padding: 4px 10px; border-radius: 4px;
                  font-size: 11px; font-weight: 700; letter-spacing: 1px;
                  text-transform: uppercase; }
  .badge-active { background: #064e3b; color: #6ee7b7; }
  .badge-pending { background: #1e3a5f; color: #93c5fd; }
  .badge-rejected { background: #4c1d1d; color: #fca5a5; }
</style>
"""


def _footer() -> str:
    return f"""
    <div class="footer">
      <p style="margin:0">{_DISCLAIMER_EN}</p>
      <p style="margin:4px 0 0">{_DISCLAIMER_ZH}</p>
    </div>
"""


def _wrap(content: str) -> str:
    return f"""<!DOCTYPE html><html>
<head><meta charset="utf-8">{_BASE_STYLE}</head>
<body><div class="wrap">
  <div class="header">
    <div class="brand">RWA-Index</div>
    <div class="subtitle">Academic Research Tool · RARM Framework</div>
  </div>
  {content}
  {_footer()}
</div></body></html>"""


def _send(to: str, subject: str, html: str) -> bool:
    """Send via Resend. Returns True on success, logs and returns False on error."""
    if not settings.resend_api_key:
        logger.warning("RESEND_API_KEY not set — email to %s not sent: %s", to, subject)
        return False
    try:
        resend.api_key = settings.resend_api_key
        resend.Emails.send({
            "from": f"{settings.email_from_name} <{settings.email_from}>",
            "to": [to],
            "subject": subject,
            "html": html,
        })
        logger.info("Email sent to %s: %s", to, subject)
        return True
    except Exception as exc:
        logger.error("Resend error sending to %s: %s", to, exc)
        return False


# ── 1. Verify Email ───────────────────────────────────────────────────────────

def send_verification_email(to: str, full_name: str, verify_url: str) -> bool:
    subject = "Please verify your email / 請驗證您的電子郵件 — RWA-Index"
    html = _wrap(f"""
    <div class="body">
      <h2>Verify your email address</h2>
      <p>Hi {full_name or 'there'},</p>
      <p>Thank you for applying to use RWA-Index. Please verify your email address
         by clicking the button below. This link expires in <strong>24 hours</strong>.</p>
      <a class="cta" href="{verify_url}">Verify Email Address</a>
      <p style="font-size:12px;color:#64748b">Or copy this link:<br>
         <span style="word-break:break-all;color:#5E5C75">{verify_url}</span></p>
      <hr class="divider">
      <div class="zh">
        <p><strong>請驗證您的電子郵件地址</strong></p>
        <p>您好 {full_name or ''},</p>
        <p>感謝您申請使用 RWA-Index。請點擊上方按鈕驗證您的電子郵件地址。
           此連結將於 <strong>24 小時</strong>後失效。</p>
      </div>
    </div>""")
    return _send(to, subject, html)


# ── 2. Auto-approved (email verified + auto-approved) ────────────────────────

def send_auto_approved_email(to: str, full_name: str, login_url: str) -> bool:
    subject = "Your RWA-Index account is active / 您的 RWA-Index 帳號已啟用"
    html = _wrap(f"""
    <div class="body">
      <h2>Your account is now active <span class="status-badge badge-active">ACTIVE</span></h2>
      <p>Hi {full_name or 'there'},</p>
      <p>Your email has been verified and your account has been automatically activated
         based on your institutional affiliation. You can now sign in and start using
         the RARM due diligence framework.</p>
      <a class="cta" href="{login_url}">Sign In to RWA-Index</a>
      <p style="font-size:12px;color:#64748b">
        All scores you produce are private and stored only in your account.
        They are never published or attributed to your institution.
      </p>
      <hr class="divider">
      <div class="zh">
        <p><strong>您的帳號已啟用 <span class="status-badge badge-active">已啟用</span></strong></p>
        <p>您好 {full_name or ''},</p>
        <p>您的電子郵件已驗證，且您的帳號已根據您的機構從屬關係自動啟用。
           您現在可以登入並開始使用 RARM 盡職調查框架。</p>
        <p style="font-size:12px">您所產生的所有評分均為私人資料，僅儲存於您的帳號中，
           不會對外公開或歸因於您的機構。</p>
      </div>
    </div>""")
    return _send(to, subject, html)


# ── 3. Pending review (email verified, waiting admin) ────────────────────────

def send_pending_review_email(to: str, full_name: str) -> bool:
    subject = "Your RWA-Index application is under review / RWA-Index 申請審核中"
    html = _wrap(f"""
    <div class="body">
      <h2>Application submitted <span class="status-badge badge-pending">UNDER REVIEW</span></h2>
      <p>Hi {full_name or 'there'},</p>
      <p>Thank you for verifying your email. Your application has been submitted and
         is currently under review. We aim to process applications within
         <strong>1–2 business days</strong>.</p>
      <p>You will receive an email once your application has been reviewed.
         No action is required from you at this time.</p>
      <hr class="divider">
      <div class="zh">
        <p><strong>申請已提交 <span class="status-badge badge-pending">審核中</span></strong></p>
        <p>您好 {full_name or ''},</p>
        <p>感謝您驗證電子郵件。您的申請已提交，目前正在審核中。
           我們將在 <strong>1–2 個工作日</strong>內處理申請。</p>
        <p>申請審核後，您將收到電子郵件通知。目前無需採取任何行動。</p>
      </div>
    </div>""")
    return _send(to, subject, html)


# ── 4. Admin approved ─────────────────────────────────────────────────────────

def send_approved_email(to: str, full_name: str, login_url: str) -> bool:
    subject = "Your RWA-Index application has been approved / RWA-Index 申請已批准"
    html = _wrap(f"""
    <div class="body">
      <h2>Application approved <span class="status-badge badge-active">APPROVED</span></h2>
      <p>Hi {full_name or 'there'},</p>
      <p>Great news — your application to use RWA-Index has been reviewed and approved.
         Your account is now active. You can sign in and start using the RARM
         due diligence framework immediately.</p>
      <a class="cta" href="{login_url}">Sign In to RWA-Index</a>
      <p style="font-size:12px;color:#64748b">
        Remember: all scores you produce are private and stored only in your account.
      </p>
      <hr class="divider">
      <div class="zh">
        <p><strong>申請已批准 <span class="status-badge badge-active">已批准</span></strong></p>
        <p>您好 {full_name or ''},</p>
        <p>好消息 — 您的 RWA-Index 申請已審核通過，您的帳號現已啟用。
           您可以立即登入並開始使用 RARM 盡職調查框架。</p>
        <p style="font-size:12px">請記住：您所產生的所有評分均為私人資料，僅儲存於您的帳號中。</p>
      </div>
    </div>""")
    return _send(to, subject, html)


# ── 5. Admin rejected ─────────────────────────────────────────────────────────

def send_rejected_email(
    to: str, full_name: str, reason: str | None = None
) -> bool:
    subject = "RWA-Index application update / RWA-Index 申請結果通知"
    reason_block = ""
    reason_block_zh = ""
    if reason:
        reason_block = f"""<p style="background:#1e1e2e;border-left:3px solid #5E5C75;
            padding:10px 14px;border-radius:0 4px 4px 0;font-size:13px">
            <strong>Reason:</strong> {reason}</p>"""
        reason_block_zh = f"""<p style="background:#1e1e2e;border-left:3px solid #5E5C75;
            padding:10px 14px;border-radius:0 4px 4px 0;font-size:13px">
            <strong>原因：</strong>{reason}</p>"""
    html = _wrap(f"""
    <div class="body">
      <h2>Application not approved <span class="status-badge badge-rejected">NOT APPROVED</span></h2>
      <p>Hi {full_name or 'there'},</p>
      <p>Thank you for your interest in RWA-Index. After review, we are unable to
         approve your application at this time.</p>
      {reason_block}
      <p>If you believe this decision was made in error or have additional context
         to share, please contact us at
         <a href="mailto:research@rwa-index.com" style="color:#5E5C75">
         research@rwa-index.com</a>.</p>
      <hr class="divider">
      <div class="zh">
        <p><strong>申請未獲批准 <span class="status-badge badge-rejected">未批准</span></strong></p>
        <p>您好 {full_name or ''},</p>
        <p>感謝您對 RWA-Index 的興趣。審核後，我們目前無法批准您的申請。</p>
        {reason_block_zh}
        <p>如果您認為此決定有誤或有其他情況需說明，請聯繫我們：
           <a href="mailto:research@rwa-index.com" style="color:#5E5C75">
           research@rwa-index.com</a></p>
      </div>
    </div>""")
    return _send(to, subject, html)


# ── 6. Newsletter confirmation ────────────────────────────────────────────────

def send_newsletter_confirmation_email(to: str, unsubscribe_token: str) -> bool:
    from app.config import settings
    unsubscribe_url = f"{settings.frontend_url}/api/newsletter/unsubscribe?token={unsubscribe_token}"
    subject = "Subscribed to HK RWA Policy Brief / 已訂閱 HK RWA 政策簡報 — RWA-Index"
    html = _wrap(f"""
    <div class="body">
      <h2>You're subscribed to the HK RWA Policy Brief</h2>
      <p>Thank you for subscribing. Each week, you'll receive a curated summary of the
         latest HKMA, SFC, and HKEx regulatory announcements relevant to RWA tokenization
         and virtual asset markets.</p>
      <p style="font-size:12px;color:#64748b">
        This is an academic research digest. All summaries are editorial and informational
        only — not investment advice. AI-assisted summaries are clearly labelled.
      </p>
      <p style="font-size:12px;color:#64748b">
        To unsubscribe at any time:
        <a href="{unsubscribe_url}" style="color:#5E5C75">click here</a>
      </p>
      <hr class="divider">
      <div class="zh">
        <p><strong>您已訂閱 HK RWA 政策簡報</strong></p>
        <p>感謝您的訂閱。每週您將收到最新 HKMA、SFC 及 HKEx 監管公告的精選摘要，
           涵蓋與 RWA 代幣化及虛擬資產市場相關的內容。</p>
        <p style="font-size:12px">如需取消訂閱，請
           <a href="{unsubscribe_url}" style="color:#5E5C75">點擊此處</a>。</p>
      </div>
    </div>""")
    return _send(to, subject, html)


# ── 7. Weekly intelligence brief ─────────────────────────────────────────────

def send_weekly_policy_brief(
    to: str,
    unsubscribe_token: str,
    headline: str,
    period_start: str,
    period_end: str,
    highlights: list[str],
    item_count: int,
) -> bool:
    from app.config import settings
    unsubscribe_url = f"{settings.frontend_url}/api/newsletter/unsubscribe?token={unsubscribe_token}"
    tracker_url = f"{settings.frontend_url}/intelligence"

    highlights_html = "".join(
        f'<li style="margin-bottom:10px;font-size:14px;line-height:1.6;color:#94a3b8">'
        f'<span style="color:#5E5C75;font-weight:700">→</span> {h}</li>'
        for h in highlights
    )
    subject = f"{headline} — RWA-Index"
    html = _wrap(f"""
    <div class="body">
      <div style="font-size:11px;color:#475569;margin-bottom:16px">
        {period_start} → {period_end}
      </div>
      <h2>{headline}</h2>
      <p style="font-size:12px;color:#64748b;margin-bottom:18px">
        {item_count} RWA-relevant regulatory item{"s" if item_count != 1 else ""} this week
        · <span style="background:#2B3437;padding:2px 6px;border-radius:3px;font-size:11px">
        AI summary · verify against source</span>
      </p>
      <ul style="padding:0;list-style:none;margin:0 0 20px">
        {highlights_html}
      </ul>
      <a class="cta" href="{tracker_url}">View Full Intelligence Tracker →</a>
      <hr class="divider">
      <p style="font-size:11px;color:#475569">
        This digest is editorial and informational only. Not investment advice.
        RWA-Index is an academic research tool.<br>
        <a href="{unsubscribe_url}" style="color:#5E5C75">Unsubscribe</a>
      </p>
    </div>""")
    return _send(to, subject, html)


# ── 8. Password reset ─────────────────────────────────────────────────────────

def send_password_reset_email(to: str, full_name: str, reset_url: str) -> bool:
    subject = "Reset your RWA-Index password / 重置您的 RWA-Index 密碼"
    html = _wrap(f"""
    <div class="body">
      <h2>Password reset request</h2>
      <p>Hi {full_name or 'there'},</p>
      <p>We received a request to reset your RWA-Index password. Click the button
         below to set a new password. This link expires in <strong>1 hour</strong>.</p>
      <a class="cta" href="{reset_url}">Reset Password</a>
      <p style="font-size:12px;color:#64748b">
        If you did not request a password reset, you can safely ignore this email.
        Your password will not be changed.
      </p>
      <p style="font-size:12px;color:#64748b">Or copy this link:<br>
         <span style="word-break:break-all;color:#5E5C75">{reset_url}</span></p>
      <hr class="divider">
      <div class="zh">
        <p><strong>密碼重置請求</strong></p>
        <p>您好 {full_name or ''},</p>
        <p>我們收到重置您 RWA-Index 密碼的請求。點擊上方按鈕設置新密碼。
           此連結將於 <strong>1 小時</strong>後失效。</p>
        <p style="font-size:12px">如果您未申請重置密碼，可以安全地忽略此電子郵件。
           您的密碼不會被更改。</p>
      </div>
    </div>""")
    return _send(to, subject, html)
