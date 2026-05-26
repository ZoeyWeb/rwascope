from pydantic_settings import BaseSettings
import json


class Settings(BaseSettings):
    database_url: str
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 7
    deepseek_api_key: str
    deepseek_base_url: str = "https://api.deepseek.com"
    deepseek_model: str = "deepseek-chat"
    cors_origins: str = '["http://localhost:5173"]'

    # ── Email (Resend) ────────────────────────────────────────────────────────
    resend_api_key: str = ""
    email_from: str = "noreply@rwa-index.com"
    email_from_name: str = "RWA-Index"

    # ── Frontend ──────────────────────────────────────────────────────────────
    frontend_url: str = "https://rwa-index.com"

    # ── Cloudflare Turnstile ──────────────────────────────────────────────────
    turnstile_secret_key: str = ""

    # ── Intelligence collection scripts ──────────────────────────────────────
    # IMAP settings for parse_emails.py
    email_host: str = "outlook.office365.com"
    email_user: str = ""
    email_pass: str = ""
    # GitHub token for monitor_github_repos.py
    github_token: str = ""

    # ── Auto-approval rules ───────────────────────────────────────────────────
    # Comma-separated TLD suffixes that get auto-approved
    auto_approve_domains: str = (
        "edu,edu.hk,edu.cn,edu.sg,edu.tw,ac.uk,ac.nz,ac.jp,edu.au,gov,gov.hk,gov.cn,gov.sg"
    )
    # Comma-separated exact domain names that get auto-approved
    auto_approve_whitelist: str = (
        "hkma.gov.hk,sfc.hk,bis.org,imf.org,worldbank.org,adb.org,oecd.org"
    )

    @property
    def cors_origins_list(self) -> list[str]:
        return json.loads(self.cors_origins)

    @property
    def sync_database_url(self) -> str:
        return self.database_url.replace("+asyncpg", "")

    @property
    def auto_approve_domains_list(self) -> list[str]:
        return [d.strip().lower() for d in self.auto_approve_domains.split(",") if d.strip()]

    @property
    def auto_approve_whitelist_list(self) -> list[str]:
        return [d.strip().lower() for d in self.auto_approve_whitelist.split(",") if d.strip()]

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
