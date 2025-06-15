# SSL Certificates for ViralHub

This directory contains SSL certificates for HTTPS encryption.

## Current Certificates

### Development (Self-Signed)
- **cert.pem** - Self-signed certificate (valid for 365 days)
- **key.pem** - Private key (keep this secure!)
- **combined.pem** - Combined certificate and key
- **dhparam.pem** - Diffie-Hellman parameters for enhanced security

⚠️ **Warning**: These are self-signed certificates for development/testing only. Browsers will show security warnings.

## For Production

### Option 1: Let's Encrypt (Recommended - Free)
```bash
# Run the SSL generation script and choose option 2
./scripts/generate-ssl-certificates.sh
```

### Option 2: Commercial Certificate
1. Purchase certificate from a Certificate Authority (CA)
2. Use the SSL script option 3 to import:
   ```bash
   ./scripts/generate-ssl-certificates.sh
   # Choose option 3 and provide paths to your cert and key files
   ```

### Option 3: Cloudflare (Proxy)
1. Use Cloudflare's free SSL/TLS
2. Set up Cloudflare as proxy
3. Use Cloudflare Origin certificates here

## Certificate Files

| File | Description | Permissions |
|------|-------------|-------------|
| cert.pem | Public certificate | 644 |
| key.pem | Private key | 600 |
| combined.pem | Combined cert+key | 644 |
| dhparam.pem | DH parameters | 644 |

## Security Notes

- Never commit private keys to git
- The key.pem file has restricted permissions (600)
- Rotate certificates before expiration
- Use strong DH parameters (2048-bit minimum)

## Verify Certificates

```bash
# Check certificate info
openssl x509 -in cert.pem -noout -text

# Verify cert and key match
./scripts/generate-ssl-certificates.sh
# Choose option 4
```

## Auto-Renewal (Let's Encrypt)

If using Let's Encrypt, auto-renewal is configured via cron:
```bash
0 2 * * * certbot renew --quiet --post-hook 'docker compose restart nginx'
```