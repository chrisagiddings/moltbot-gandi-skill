# Security Policy

## Reporting Security Vulnerabilities

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please email security concerns to the repository owner.

We will acknowledge your email within 48 hours and provide a detailed response indicating the next steps.

---

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.2.x   | :white_check_mark: |
| 0.1.x   | :white_check_mark: |

---

## Security Features

### Credential Management

**This skill NEVER:**
- ❌ Stores credentials in code
- ❌ Logs API tokens or secrets
- ❌ Transmits credentials to third parties
- ❌ Includes credentials in error messages

**This skill supports:**
- ✅ External credential storage (`~/.config/gandi/`)
- ✅ Secure file permissions (chmod 600)
- ✅ Environment variable overrides
- ✅ Sandbox environment for testing

### Data Privacy

**This skill does NOT:**
- ❌ Collect telemetry or analytics
- ❌ Phone home to external services
- ❌ Log user content to external systems
- ❌ Share data with third parties

**This skill stores locally:**
- API tokens (`~/.config/gandi/api_token`) - with secure permissions
- Contact information (`~/.config/gandi/contact.json`) - optional, with privacy preferences
- API URL override (`~/.config/gandi/api_url`) - optional, for sandbox testing
- NO user-generated content in repository

**This skill transmits:**
- ✅ API requests to Gandi API only (via HTTPS)
- ✅ No third-party API calls

### API Security

**Gandi Personal Access Tokens:**
- Provide scoped access to your Gandi account
- Support minimal permissions (read-only, write)
- Can be revoked instantly
- Should be rotated every 90 days

**This skill:**
- ✅ Uses HTTPS-only communication
- ✅ Implements rate limiting (respects Gandi's limits)
- ✅ Supports minimal scope principle
- ✅ Validates API responses

### Input Validation

**Domain Sanitization:**
- ✅ RFC 1035 format validation
- ✅ Length limits enforced (253 chars total, 63 per label)
- ✅ Path traversal prevention
- ✅ Special character filtering

**DNS Record Sanitization:**
- ✅ Record name validation
- ✅ Wildcard support with validation
- ✅ TTL range enforcement (300-2592000 seconds)
- ✅ Type-specific value validation

**Contact Information:**
- ✅ Email format validation
- ✅ Phone format validation (international)
- ✅ State code normalization (US)
- ✅ Redacted logging for sensitive fields

### Operation Classification

All operations are classified for safety:

- **Safe (Read-Only):** GET requests, listing domains/DNS, availability checks
- **Destructive:** POST/PUT/DELETE operations, DNS modifications, email forwards
- **Permanent:** Domain registration (costs money), DNS bulk updates
- **High-Risk:** Domain transfers, nameserver changes

---

## Security Best Practices

### For Users

1. **Protect Your API Token**
   - Never commit to version control
   - Use minimal required scopes
   - Rotate every 90 days
   - Use separate tokens for development/production

2. **Test on Sandbox First**
   - Create sandbox account: https://admin.sandbox.gandi.net
   - Generate sandbox token
   - Test DNS changes safely
   - Verify operations before production

3. **Review Before Destructive Operations**
   - DNS changes can take 24-48 hours to propagate
   - Use `--force` flags carefully
   - Create snapshots before bulk operations
   - Verify domain names before operations

4. **Monitor Your Account**
   - Regularly check Gandi Admin dashboard
   - Review recent DNS changes
   - Watch for unexpected email forwards
   - Enable 2FA on Gandi account

5. **Contact Information Privacy**
   - Choose PURGE option for sensitive personal data
   - Delete manually with `delete-contact.js` when done
   - Review saved contact periodically
   - Consider using privacy protection service

### For Developers

1. **Never Commit Credentials**
   - API tokens, URLs, contact info
   - `.gitignore` is configured for common patterns
   - Review commits before pushing
   - Use pre-commit hooks

2. **Validate All Inputs**
   - Use `sanitizeDomain()` for domain names
   - Use `sanitizeRecordName()` for DNS records
   - Use `sanitizeTTL()` for TTL values
   - Never trust user input

3. **Handle Errors Safely**
   - Never expose credentials in error messages
   - Use `sanitizeForLog()` for logging objects
   - Fail securely (deny by default)
   - Provide helpful error messages without exposing internals

4. **Follow Principle of Least Privilege**
   - Request minimal token scopes needed
   - Document what each operation does
   - Classify operations accurately (safe/destructive/permanent)

---

## Incident Response

**If you suspect your API token has been compromised:**

1. **Immediately revoke the token:**
   - Gandi Admin → Personal Access Tokens
   - Delete the compromised token

2. **Create a new token:**
   - Generate new token with minimal scopes
   - Update `~/.config/gandi/api_token`

3. **Review your account:**
   - Check domains for unexpected changes
   - Review DNS records for all domains
   - Check email forwards
   - Review domain contacts

4. **Enable 2FA:**
   - Gandi Admin → Security Settings
   - Enable two-factor authentication

5. **Report the incident:**
   - Email the security team
   - Provide details (when, how discovered)
   - Do not share the compromised token

---

## Security Checklist

**Before first use:**
- [ ] API token stored securely (NOT in code)
- [ ] Config files have secure permissions (chmod 600)
- [ ] Test on sandbox site, not production
- [ ] Understand operation classifications (safe/destructive)

**Regular maintenance:**
- [ ] Rotate API tokens every 90 days
- [ ] Review .gitignore before commits
- [ ] Monitor Gandi account for unexpected changes
- [ ] Keep contact information up-to-date

**Before destructive operations:**
- [ ] Create DNS snapshot (bulk operations do this automatically)
- [ ] Review domain name carefully
- [ ] Verify record details
- [ ] Test on staging domain first if possible

---

## Known Limitations

1. **Token Scoping**
   - Some operations require write access
   - Cannot create read-only tokens for DNS modifications
   - Must trust the skill with full API access

2. **No Undo for Some Operations**
   - Domain registration is permanent (costs money)
   - DNS changes propagate globally (use snapshots to restore)
   - Email forwards can be deleted but not recovered

3. **Rate Limiting**
   - Gandi enforces 1000 requests/minute
   - Skill defaults to 100 requests/minute (configurable)
   - Bulk operations may be slow for large datasets

4. **DNS Propagation**
   - Changes can take 24-48 hours to propagate
   - Not all resolvers update immediately
   - Use short TTL values before making changes

---

## Security Audit Log

| Date | Version | Auditor | Findings | Status |
|------|---------|---------|----------|--------|
| 2026-02-10 | 0.2.0 | Navi (AI) | See audit report | ✅ Addressed |

---

## Contact

For security concerns, please contact the repository owner.

**Do not report security issues via public GitHub issues.**

---

## Acknowledgments

Security best practices informed by:
- Gandi API documentation
- OWASP Secure Coding Practices
- RFC 1035 (Domain Names)
- Node.js Security Working Group guidelines

---

## Security Disclosure Timeline

If you report a security vulnerability:

- **Day 0:** Acknowledge receipt within 48 hours
- **Day 1-7:** Investigate and confirm vulnerability
- **Day 7-14:** Develop and test fix
- **Day 14-30:** Release patch and security advisory
- **Day 30+:** Public disclosure (after fix is widely deployed)

We appreciate responsible disclosure and will credit researchers (with permission) in security advisories.
