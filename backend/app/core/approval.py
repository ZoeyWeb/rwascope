"""
Auto-approval logic.

An email domain qualifies for automatic approval if:
  1. The domain exactly matches an entry in the whitelist, OR
  2. The domain ends with a suffix from the approved-domains list.

All comparisons are case-insensitive.
"""
from app.config import settings


def _domain_from_email(email: str) -> str:
    """Extract the domain part of an email address, lower-cased."""
    return email.strip().lower().split("@", 1)[-1]


def should_auto_approve(email: str) -> bool:
    """Return True if this email qualifies for automatic account activation."""
    domain = _domain_from_email(email)

    # 1. Exact whitelist match  (e.g. hkma.gov.hk)
    if domain in settings.auto_approve_whitelist_list:
        return True

    # 2. Domain ends with an approved suffix
    #    e.g. "edu" matches "hku.edu.hk"? No — only suffix match.
    #    e.g. "edu.hk" matches "cs.hku.edu.hk" → True
    #    e.g. "gov" matches "data.gov.hk" → True (ends with ".gov" or IS "gov")
    for suffix in settings.auto_approve_domains_list:
        if domain == suffix or domain.endswith("." + suffix):
            return True

    return False
