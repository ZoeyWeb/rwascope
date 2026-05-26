"""
Rate limiting via slowapi (wrapper around limits library).

Limiter uses the real client IP. When behind Cloudflare the real IP
is in the CF-Connecting-IP header; slowapi's key_func reads X-Forwarded-For
by default which Nginx sets correctly.
"""
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
