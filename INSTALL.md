# Secure Installation Guide

**This document provides step-by-step instructions for securely installing and configuring the Gandi skill.**

---

## ⚠️ READ THIS FIRST

This skill can:
- ✅ Modify DNS records (can break your website/email)
- ✅ Delete DNS records (permanent data loss)
- ✅ Manage email forwards (can redirect your email)
- ✅ Register domains (costs real money - Phase 3+)

**Treat this like installing software with root access to your domains.**

---

## Prerequisites

- **Node.js** ≥18.0.0
- **npm** (bundled with Node.js)
- **Gandi account** with domains
- **Gandi Personal Access Token** (PAT)

**Check your Node.js version:**
```bash
node --version  # Should be v18.0.0 or higher
npm --version   # Should be 9.0.0 or higher
```

---

## Step 1: Clone Repository

```bash
# Clone from GitHub
git clone https://github.com/chrisagiddings/moltbot-gandi-skill.git
cd moltbot-gandi-skill
```

---

## Step 2: Verify Metadata & Code

**CRITICAL: Verify the repository hasn't been tampered with**

### Check Metadata (_meta.json)

```bash
cat _meta.json
```

**Expected output:**
```json
{
  "name": "gandi",
  "openclaw": {
    "disable-model-invocation": true,
    "capabilities": ["dns-modification", "email-management", ...],
    "credentials": {
      "type": "file",
      "location": "~/.config/gandi/api_token",
      "required": true
    },
    "requires": {
      "bins": ["node", "npm"]
    }
  }
}
```

**Verify:**
- ✅ `disable-model-invocation: true` - Prevents autonomous model actions
- ✅ Credentials location declared
- ✅ Binary requirements declared

### Review Security Documentation

```bash
# Read security policy
cat SECURITY.md

# Read main documentation
cat README.md

# Review gandi-skill/SKILL.md
cat gandi-skill/SKILL.md
```

### Inspect Package Dependencies

```bash
cd gandi-skill/scripts
cat package.json
```

**Expected output:**
```json
{
  "dependencies": {}
}
```

**✅ GOOD:** Zero dependencies = no npm supply chain risk

**⚠️ IF DEPENDENCIES EXIST:**
- Review each package on npmjs.com
- Check download counts and maintenance
- Look for security advisories
- Run `npm audit` before installing

---

## Step 3: Audit Dependencies

```bash
cd gandi-skill/scripts

# Check for vulnerabilities (should show zero)
npm audit

# Install dependencies (currently none)
npm install
```

**Expected output:**
```
found 0 vulnerabilities
```

**⚠️ IF VULNERABILITIES FOUND:**
- DO NOT PROCEED
- Review the vulnerability report
- Check if there's a newer version of the skill
- Report to maintainer

---

## Step 4: Create Gandi API Token (Read-Only First)

**RECOMMENDED: Start with read-only token for testing**

1. Go to https://admin.gandi.net/organizations/account/pat
2. Click "Create a token"
3. Select your organization
4. **Choose ONLY read scopes for testing:**
   - ✅ Domain: read
   - ✅ LiveDNS: read
   - ✅ Email: read
   - ❌ **DO NOT** select write scopes yet
5. Copy the token (you won't see it again!)

---

## Step 5: Store Token Securely

```bash
# Create config directory
mkdir -p ~/.config/gandi

# Store read-only token
echo "YOUR_READ_ONLY_TOKEN_HERE" > ~/.config/gandi/api_token

# Set owner-only permissions (CRITICAL)
chmod 600 ~/.config/gandi/api_token

# Verify permissions
ls -la ~/.config/gandi/api_token
# Should show: -rw------- (600)
```

**Security checks:**
```bash
# Verify token file is NOT world-readable
stat -f "%OLp" ~/.config/gandi/api_token
# Should output: 600

# Verify token file is NOT in git
cd ~/moltbot-gandi-skill
git check-ignore ~/.config/gandi/api_token
# Should output: (path - meaning it's ignored)
```

---

## Step 6: Test Authentication (Safe)

```bash
cd gandi-skill/scripts

# Test authentication with read-only token
node test-auth.js
```

**Expected output:**
```
✅ Authentication successful!

Your organizations:
  1. Personal Account (uuid-here)
     Type: individual

🎉 You're ready to use the Gandi skill!
```

**⚠️ IF AUTHENTICATION FAILS:**
- Check token is correct (no extra spaces)
- Verify token hasn't expired
- Ensure token has required read scopes
- Check file permissions (should be 600)

---

## Step 7: Test Safe Read Operations

**Test with non-destructive commands first:**

```bash
# List your domains (safe - read-only)
node list-domains.js

# List DNS records for a domain (safe - read-only)
node list-dns.js yourdomain.com

# Check domain availability (safe - read-only)
node check-domain.js example-test-domain.com

# List email forwards (safe - read-only)
node list-email-forwards.js yourdomain.com
```

**All of these are safe read-only operations.**

---

## Step 8: Test on Sandbox (Before Production)

**HIGHLY RECOMMENDED: Use Gandi's sandbox environment**

1. **Create sandbox account:**
   - Go to https://admin.sandbox.gandi.net
   - Create test account (separate from production)

2. **Create sandbox token:**
   - Generate PAT in sandbox admin
   - Include read AND write scopes (sandbox is safe to test)

3. **Configure skill for sandbox:**
   ```bash
   # Use sandbox token
   echo "YOUR_SANDBOX_TOKEN" > ~/.config/gandi/api_token
   
   # Point to sandbox API
   echo "https://api.sandbox.gandi.net" > ~/.config/gandi/api_url
   ```

4. **Test destructive operations safely:**
   ```bash
   # Add a DNS record (sandbox domain)
   node add-dns-record.js sandbox-test.com test A 1.2.3.4
   
   # Delete the record
   node delete-dns-record.js sandbox-test.com test A --force
   
   # Test bulk updates
   echo '[{"rrset_name":"@","rrset_type":"A","rrset_ttl":10800,"rrset_values":["1.2.3.4"]}]' | \
     node update-dns-bulk.js sandbox-test.com
   ```

---

## Step 9: Production Use (Optional)

**ONLY proceed if:**
- ✅ Tested on sandbox successfully
- ✅ Understand what each command does
- ✅ Ready to perform real changes

### Create Production Write Token

1. Go to https://admin.gandi.net/organizations/account/pat
2. Create **separate token** for write operations
3. Select write scopes:
   - ✅ Domain: read
   - ✅ LiveDNS: read
   - ✅ LiveDNS: write
   - ✅ Email: read
   - ✅ Email: write
4. Copy token

### Store Production Tokens Separately

```bash
# Store read-only token (default)
echo "YOUR_READ_TOKEN" > ~/.config/gandi/api_token
chmod 600 ~/.config/gandi/api_token

# Store write token (separate file)
echo "YOUR_WRITE_TOKEN" > ~/.config/gandi/api_token_write
chmod 600 ~/.config/gandi/api_token_write

# Point to production API
echo "https://api.gandi.net" > ~/.config/gandi/api_url
```

### Switch Tokens for Write Operations

```bash
# Before write operation: switch to write token
mv ~/.config/gandi/api_token ~/.config/gandi/api_token_read
mv ~/.config/gandi/api_token_write ~/.config/gandi/api_token

# Perform write operation
node add-dns-record.js production.com www A 192.168.1.1

# After write operation: restore read-only token
mv ~/.config/gandi/api_token ~/.config/gandi/api_token_write
mv ~/.config/gandi/api_token_read ~/.config/gandi/api_token
```

**Benefits of token separation:**
- ✅ Limits damage if token leaks
- ✅ Forces conscious decision for write operations
- ✅ Separate audit trails in Gandi logs
- ✅ Can revoke write access without breaking reads

---

## Step 10: Regular Maintenance

### Rotate Tokens Every 90 Days

```bash
# Set calendar reminder
echo "Rotate Gandi API tokens - Last rotated: $(date)" >> ~/gandi-token-rotation.log

# When rotating:
# 1. Create new token in Gandi Admin
# 2. Update ~/.config/gandi/api_token
# 3. Test with list-domains.js
# 4. Delete old token in Gandi Admin
```

### Monitor Your Gandi Account

- Check Gandi Admin dashboard weekly
- Review DNS changes for unexpected modifications
- Watch for new email forwards you didn't create
- Monitor domain expiration dates

### Keep Skill Updated

```bash
cd moltbot-gandi-skill

# Check for updates
git fetch
git log HEAD..origin/main

# Update to latest
git pull

# Re-run security checks
cat SECURITY.md
npm audit
```

---

## Security Checklist

**Before first use:**
- [ ] Verified _meta.json declares requirements correctly
- [ ] Read SECURITY.md completely
- [ ] Inspected package.json (zero dependencies)
- [ ] Run `npm audit` with zero vulnerabilities
- [ ] Created read-only token for testing
- [ ] Stored token with 0600 permissions
- [ ] Tested authentication successfully
- [ ] Tested safe read operations
- [ ] Tested on sandbox environment
- [ ] Understand operation classifications

**For production use:**
- [ ] Created separate read/write tokens
- [ ] Tested write operations on sandbox
- [ ] Verified DNS snapshots work
- [ ] Set up token rotation reminder
- [ ] Documented which token is for what
- [ ] Backed up current DNS records

**Ongoing:**
- [ ] Rotate tokens every 90 days
- [ ] Monitor Gandi account weekly
- [ ] Keep skill updated
- [ ] Review security advisories

---

## Troubleshooting

### "Token file not found"
```bash
# Check file exists
ls -la ~/.config/gandi/api_token

# If missing, create it (see Step 5)
```

### "Permission denied"
```bash
# Fix permissions
chmod 600 ~/.config/gandi/api_token
```

### "Authentication failed (401)"
```bash
# Token is invalid or expired
# Create new token in Gandi Admin
# Update file: echo "NEW_TOKEN" > ~/.config/gandi/api_token
```

### "Permission denied (403)"
```bash
# Token doesn't have required scopes
# Create new token with correct scopes
# Or verify organization membership
```

---

## Emergency: Token Compromised

**If you suspect your token has been leaked:**

1. **Immediately revoke the token:**
   - Log in to https://admin.gandi.net
   - Go to Personal Access Tokens
   - Delete the compromised token

2. **Check for unauthorized changes:**
   - Review DNS records for all domains
   - Check email forwards
   - Look at Gandi audit log (if available)

3. **Create new token:**
   - Generate new PAT with minimal scopes
   - Store securely with 0600 permissions

4. **Investigate the leak:**
   - Check if token was committed to git
   - Review system logs
   - Scan for malware
   - Change passwords if needed

5. **Report the incident:**
   - Email maintainer (NOT via GitHub issues)
   - Document what was compromised
   - Note any unauthorized changes

---

## Support

- **Security issues:** Email repository owner privately (NOT via GitHub issues)
- **General questions:** Create GitHub issue
- **Gandi support:** https://help.gandi.net

---

## Additional Resources

- [Gandi API Documentation](https://api.gandi.net/docs/)
- [Gandi Admin Panel](https://admin.gandi.net)
- [Sandbox Environment](https://admin.sandbox.gandi.net)
- [Security Policy](SECURITY.md)
- [Main Documentation](README.md)
