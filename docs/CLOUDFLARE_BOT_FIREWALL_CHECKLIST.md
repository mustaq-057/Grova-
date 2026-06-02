# Cloudflare Bot + Firewall Checklist

Use this before production DNS cutover.

## 1) SSL/TLS
- Set SSL mode to **Full (strict)**.
- Enable **Always Use HTTPS**.
- Enable **Automatic HTTPS Rewrites**.

## 2) WAF Managed Rules
- Enable Cloudflare Managed Ruleset.
- Enable OWASP rules in block/challenge mode.
- Turn on bot-specific rules for credential stuffing protection.

## 3) Bot Protection
- Enable **Bot Fight Mode**.
- If you have Pro/Business: enable **Super Bot Fight Mode** and challenge likely bots.
- Add JS challenge for paths:
  - `/api/auth/primary-login`
  - `/api/auth/login`
  - `/api/auth/refresh`

## 4) Rate Limiting Rules
- Create strict limits for auth endpoints:
  - `/api/auth/primary-login`: 5 requests / 15 minutes per IP
  - `/api/auth/login`: 5 requests / 15 minutes per IP
  - `/api/auth/refresh`: 20 requests / 15 minutes per IP
- Create general API rate rule:
  - `/api/*`: burst + sustained limits with temporary block/challenge.

## 5) Country / ASN Controls (Optional)
- If your users are in specific countries only, challenge/block unexpected regions.
- Block known abusive ASNs if you see repeated attacks in logs.

## 6) Security Headers
- Keep HSTS enabled in production.
- Keep CSP enabled in production.
- Keep X-Powered-By disabled.

## 7) Logging + Monitoring
- Enable Cloudflare security event logs.
- Alert on spikes in challenged and blocked requests.
- Review `/api/auth/*` events weekly.

## 8) DNS / Origin Hardening
- Proxy DNS records through Cloudflare (orange cloud).
- Restrict direct origin access with firewall rules/security groups.
- Only allow Cloudflare IP ranges to origin where possible.
