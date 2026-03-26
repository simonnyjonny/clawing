# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.1.x (Alpha) | ✅ |

## Reporting a Vulnerability

If you discover a security vulnerability, please send an email to:
- Do NOT create a public GitHub Issue

Please include:
1. Description of the vulnerability
2. Steps to reproduce
3. Potential impact
4. Any suggested fixes (if any)

## Security Best Practices

When deploying this application:

1. **Change default secrets**: Update `JWT_SECRET` in production
2. **Use HTTPS**: Enable SSL/TLS for all endpoints
3. **Database**: Use strong credentials and enable SSL
4. **CORS**: Configure appropriate origins for your domain
5. **Rate limiting**: Consider adding rate limiting in production

## Known Limitations (Alpha)

- This is an Alpha version for demonstration purposes
- OpenClaw real instance integration is not yet complete
- Some security features may need additional hardening before production use