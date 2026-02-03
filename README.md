# Gandi Domain Registrar Skill for Moltbot

Comprehensive Gandi domain registrar integration for [Moltbot](https://github.com/openclaw/openclaw) (formerly Clawdbot).

## Status

✅ **Phase 1 MVP Complete** - Basic domain management, DNS operations, and domain availability checking functional.

✅ **Phase 2 - DNS Modification Complete** - Full DNS record management with create, update, delete, and zone snapshots.

✅ **Phase 3 - Domain Registration & Renewal Complete** - Register new domains and renew existing ones with comprehensive safety features.

✅ **Phase 4 - DNSSEC Configuration Complete** - Enable, disable, and manage DNSSEC with extensive warnings and guidance.

✅ **Phase 5 - Email Forwarding Complete** - Manage email forwards with catch-all support and validation.

✅ **Phase 6 - SSL Certificate Management Complete** - Manage Gandi SSL certificates with request, monitoring, and details viewing.

✅ **Phase 7 - Multi-Organization Support Complete** - Manage multiple Gandi organizations with profile-based token management.

## Features

### ✅ Currently Available

- **Authentication** - Personal Access Token (PAT) support
- **Domain Management** ✨ NEW
  - List all domains in your account
  - Get detailed domain information
  - Check domain expiration and auto-renewal status
  - View domain services (LiveDNS, Email, etc.)
  - **Register new domains** with availability pre-check and pricing
  - **Renew existing domains** with cost calculation
  - **Configure auto-renewal** settings
  - Multiple confirmation steps for paid operations
  - Dry-run mode for testing without charges
- **Domain Availability Checking**
  - Single domain lookup with pricing
  - Smart domain suggestions with name variations
  - TLD alternatives (com, net, org, io, dev, app, ai, tech, etc.)
  - Rate limiting and API citizenship
- **DNS Operations**
  - List DNS records for any domain
  - View record details by type
  - Check nameserver configuration
  - **Create/update DNS records** (A, AAAA, CNAME, MX, TXT, NS, SRV, CAA)
  - **Delete DNS records** with safety confirmations
  - **Zone snapshots** (create, list, restore)
  - Automatic snapshots before modifications
  - Input validation for all record types
- **DNSSEC Management**
  - Check DNSSEC status and view keys
  - Enable DNSSEC with automatic key generation
  - Disable DNSSEC with key cleanup
  - View DS records for registry submission
  - Extensive warnings and safety guidance
  - Algorithm and key type information
- **Email Forwarding**
  - List all email forwards for a domain
  - Create email forwards (alias → destination)
  - Update forward destinations
  - Delete email forwards
  - Catch-all forwarding support
  - Multiple destination support
  - Email address validation
- **SSL Certificate Management**
  - List certificates managed by Gandi
  - View detailed certificate information
  - Request new certificates (with validation methods)
  - DNS, email, and HTTP validation support
  - Certificate status monitoring
  - Expiration tracking
  - Auto-renewal status viewing
- **Multi-Organization Support** ✨ NEW
  - Manage multiple Gandi organizations
  - Profile-based token management
  - Separate tokens per organization
  - Default profile configuration
  - Profile switching for all commands
  - Automatic legacy token migration
  - Organization info display
- **SSL Certificate Monitoring**
  - Check SSL status for all domains
  - Certificate issuer identification
  - Expiration warnings
- **API Citizenship**
  - Built-in rate limiting (100 req/min, 10% of Gandi's limit)
  - Configurable concurrent request limits
  - Automatic throttling and queuing

### 🚧 Coming Soon

- Gateway Console configuration ([#3](https://github.com/chrisagiddings/moltbot-gandi-skill/issues/3))
- Email forwarding configuration ([#11](https://github.com/chrisagiddings/moltbot-gandi-skill/issues/11))

## Requirements

- **Moltbot/Clawdbot** v2026.1+
- **Gandi Personal Access Token** - Create at [Gandi Admin](https://admin.gandi.net/organizations/account/pat)
- Valid Gandi account with domains (or use sandbox for testing)

## Installation

### Via ClawdHub (Coming Soon)

```bash
moltbot skills install gandi
```

### Manual Installation

```bash
# Clone the repository
git clone https://github.com/chrisagiddings/moltbot-gandi-skill.git
cd moltbot-gandi-skill

# Copy skill to Moltbot skills directory
cp -r gandi-skill ~/.moltbot/skills/

# Or symlink for development
ln -s $(pwd)/gandi-skill ~/.moltbot/skills/gandi
```

## Setup

### 1. Create Personal Access Token

1. Go to [Gandi Admin → Personal Access Tokens](https://admin.gandi.net/organizations/account/pat)
2. Click **"Create a token"**
3. Select your organization
4. Choose scopes:
   - ✅ **Domain: read** (required for domain listing)
   - ✅ **Domain: write** (required for registration & renewal)
   - ✅ **LiveDNS: read** (required for DNS viewing)
   - ✅ **LiveDNS: write** (required for DNS modifications)
   - ✅ **Email: read** (required for viewing email forwards) ✨ NEW
   - ✅ **Email: write** (required for managing email forwards) ✨ NEW
5. Copy the token (you won't see it again!)

### 2. Store Token

```bash
# Create config directory
mkdir -p ~/.config/gandi

# Store your token (replace YOUR_PAT with actual token)
echo "YOUR_PERSONAL_ACCESS_TOKEN" > ~/.config/gandi/api_token

# Secure the file (owner read-only)
chmod 600 ~/.config/gandi/api_token
```

### 3. Test Authentication

```bash
cd gandi-skill/scripts
node test-auth.js
```

**Expected output:**
```
✅ Authentication successful!

Organization: yourname
Type: individual
UUID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

### Sandbox Testing (Optional)

To use Gandi's sandbox environment for testing:

```bash
# Create sandbox token at: https://admin.sandbox.gandi.net
echo "YOUR_SANDBOX_TOKEN" > ~/.config/gandi/api_token
echo "https://api.sandbox.gandi.net" > ~/.config/gandi/api_url
```

## Usage

### Command-Line Scripts

All scripts are located in `gandi-skill/scripts/`:

#### 1. List Your Domains

```bash
node list-domains.js
```

Shows domain names, expiration dates, auto-renewal status, services, and organization ownership.

#### 2. View DNS Records

```bash
node list-dns.js example.com
```

Displays all DNS records grouped by type (A, CNAME, MX, TXT, etc.) with TTL values and nameservers.

#### 3. Check Domain Availability

```bash
node check-domain.js example.com
```

**Features:**
- Availability status
- Pricing information (registration, renewal, transfer)
- Supported features (DNSSEC, LiveDNS)
- Discount pricing when available

**Example output:**
```
🔍 Checking availability for: yattadone.app

Domain: yattadone.app

✅ Status: AVAILABLE

💰 Pricing:
  1 year: $14.99 USD (normally $23.29)
  2-10 years: $23.29 USD

📋 Supported Features:
  • create
```

#### 4. Smart Domain Suggestions

```bash
# Check all configured TLDs + variations
node suggest-domains.js example

# Check specific TLDs only
node suggest-domains.js example --tlds com,net,io,app

# Skip name variations (only check TLDs)
node suggest-domains.js example --no-variations

# Output as JSON
node suggest-domains.js example --json
```

**Name Variation Patterns:**
- **Hyphenated**: `example` → `ex-ample`
- **Abbreviated**: `example` → `exmpl`
- **Prefix**: `example` → `get-example`, `my-example`, `the-example`, `try-example`
- **Suffix**: `example` → `example-app`, `example-hub`, `exampleio`, `examplely`
- **Numbers**: `example` → `example2`, `example3`

**Limits (configurable):**
- Max 5 TLDs checked (reduces API load)
- Max 10 name variations
- Rate limited to 100 requests/min

#### 5. Check SSL Certificates

```bash
node check-ssl.js
```

Scans all domains for SSL certificate status, shows issuers, expiration dates, and warnings for missing certificates.

#### 6. Add/Update DNS Records ✨ NEW

```bash
node add-dns-record.js example.com A www 192.0.2.1
node add-dns-record.js example.com CNAME blog example.com. 3600
node add-dns-record.js example.com MX @ "10 mail.example.com."
node add-dns-record.js example.com TXT @ "v=spf1 include:_spf.google.com ~all"
```

**Features:**
- Creates new records or updates existing ones
- Automatic snapshot before modifications
- Input validation for all record types
- Shows current record before updating
- Supports custom TTL values

**Supported Record Types:**
A, AAAA, CNAME, MX, TXT, NS, SRV, CAA, PTR

#### 7. Update DNS Records ✨ NEW

```bash
node update-dns-record.js example.com A www 192.0.2.10
node update-dns-record.js example.com TXT @ "v=spf1 ..."
```

Convenience wrapper around add-dns-record.js with update-focused messaging.

#### 8. Delete DNS Records ✨ NEW

```bash
node delete-dns-record.js example.com A temp --confirm
node delete-dns-record.js example.com CNAME staging --confirm
```

**Safety Features:**
- Shows current record before deletion
- Requires confirmation (or --confirm flag)
- Extra warnings for critical records (@, www, mail, NS, MX)
- Automatic snapshot before deletion
- Cannot be undone (except via snapshot restore)

#### 9. Manage Zone Snapshots ✨ NEW

```bash
# List all snapshots
node manage-snapshots.js example.com list

# Create a snapshot
node manage-snapshots.js example.com create "Before DNS migration"

# Restore from snapshot
node manage-snapshots.js example.com restore abc123-uuid --confirm
```

**Snapshot Features:**
- Manual and automatic snapshots
- Restore entire zone configuration
- View snapshot creation dates
- Distinguish automatic vs manual snapshots

#### 10. Register New Domains ✨ NEW

```bash
# Check availability and pricing (dry-run)
node register-domain.js example.com --dry-run

# Register a domain
node register-domain.js example.com --years 2 --contact owner.json

# Register with auto-renewal enabled
node register-domain.js example.com --years 1 --auto-renew --contact owner.json
```

**⚠️  WARNING: Domain registration costs real money and is NON-REFUNDABLE!**

**Features:**
- Pre-check availability with pricing
- Multiple confirmation steps
- Contact information validation
- Dry-run mode for testing
- Shows total cost before charging
- Optional auto-renewal configuration

**Contact JSON Format:**
```json
{
  "given": "John",
  "family": "Doe",
  "email": "john@example.com",
  "streetaddr": "123 Main St",
  "city": "Paris",
  "zip": "75001",
  "country": "FR",
  "phone": "+33.123456789",
  "type": "individual"
}
```

**Contact Types:** `individual`, `company`, `association`, `publicbody`

#### 11. Renew Existing Domains ✨ NEW

```bash
# Check renewal pricing (dry-run)
node renew-domain.js example.com --dry-run

# Renew a domain
node renew-domain.js example.com --years 1

# Renew for multiple years
node renew-domain.js example.com --years 3
```

**⚠️  WARNING: Domain renewal costs real money and is NON-REFUNDABLE!**

**Features:**
- Shows current expiration and days remaining
- Calculates new expiration date
- Multiple confirmation steps
- Dry-run mode for pricing check
- Shows auto-renewal status

#### 12. Configure Auto-Renewal ✨ NEW

```bash
# Check current auto-renewal status
node configure-autorenew.js example.com status

# Enable auto-renewal
node configure-autorenew.js example.com enable

# Enable with custom duration
node configure-autorenew.js example.com enable --years 2

# Disable auto-renewal
node configure-autorenew.js example.com disable
```

**Auto-Renewal Features:**
- Enable/disable automatic renewal
- Configure renewal duration (1-10 years)
- View current settings
- Prevents accidental domain loss

#### 13. DNSSEC Management ✨ NEW

```bash
# Check DNSSEC status and view keys
node dnssec-status.js example.com

# Enable DNSSEC (dry-run)
node dnssec-enable.js example.com --dry-run

# Enable DNSSEC
node dnssec-enable.js example.com

# Disable DNSSEC
node dnssec-disable.js example.com --confirm
```

**⚠️  WARNING: DNSSEC is complex and can break DNS if misconfigured!**

**DNSSEC Features:**
- View DNSSEC status and keys (KSK, ZSK)
- Automatic key generation when enabled
- DS record display for registry submission
- Extensive warnings and guidance
- Key algorithm and flag information
- Validation instructions

**Important DNSSEC Workflow:**
1. Lower DNS TTLs to 300-600 seconds
2. Wait for old TTL to expire
3. Enable DNSSEC (generates keys automatically)
4. **Submit DS records to your domain registrar (CRITICAL!)**
5. Wait 24-48 hours for DS propagation
6. Verify with DNSSEC validators
7. Raise TTLs back to normal

**DNSSEC Validators:**
- https://dnssec-debugger.verisignlabs.com/
- https://dnsviz.net/

**Key Algorithms Supported:**
- Algorithm 13 (ECDSAP256SHA256) - Recommended
- Algorithm 8 (RSASHA256)
- Algorithm 15 (ED25519)
- Others as supported by Gandi

#### 14. Email Forwarding Management ✨ NEW

```bash
# List all email forwards
node list-email-forwards.js example.com

# Create an email forward
node add-email-forward.js example.com hello hello@gmail.com

# Create forward with multiple destinations
node add-email-forward.js example.com support support@gmail.com team@company.com

# Set up catch-all (forwards all unmatched emails)
node add-email-forward.js example.com @ admin@example.com

# Update forward destination
node update-email-forward.js example.com hello newemail@gmail.com

# Delete email forward
node delete-email-forward.js example.com old-alias --confirm
```

**Email Forwarding Features:**
- List all configured forwards
- Create forwards (alias → destination)
- Update forward destinations
- Delete forwards with confirmation
- Catch-all support (@ forwards all unmatched)
- Multiple destinations per forward
- Email address validation

**Service Requirements:**
- Email forwarding service must be enabled at Gandi
- MX records must point to Gandi's email servers
- SPF records recommended for deliverability

**Common Use Cases:**
- Personal domain forwarding (hello@ → personal email)
- Team aliases (support@, sales@, info@)
- Catch-all for small domains
- Department routing

**⚠️  Catch-All Warning:**
Catch-all forwards receive ALL unmatched emails including spam.
Use with caution and consider specific forwards instead.

#### 15. SSL Certificate Management ✨ NEW

```bash
# List certificates managed by Gandi
node list-certificates.js

# View certificate details
node cert-details.js <certificate-id>

# Request new certificate (dry-run)
node request-certificate.js example.com --dry-run

# Request certificate with DNS validation
node request-certificate.js example.com --method dns

# Request with email validation
node request-certificate.js example.com --method email

# Check SSL status of all domains (existing tool)
node check-ssl.js
```

**⚠️  IMPORTANT: Gandi SSL certificates may have costs!**

**Certificate Management Features:**
- List certificates managed through Gandi
- View detailed certificate information (SANs, dates, status)
- Request new certificates with validation methods
- DNS-01, email, and HTTP-01 validation support
- Certificate status monitoring (valid, pending, expired)
- Expiration tracking with warnings
- Auto-renewal status viewing

**Validation Methods:**
- **DNS (dns-01)**: Add TXT records to DNS (supports wildcards)
- **Email**: Click validation link sent to admin addresses
- **HTTP (http-01)**: Place file on web server (port 80)

**Service Notes:**
- This manages certificates through Gandi's certificate service
- Gandi SSL certificates may require subscription or purchase
- Check pricing at: https://www.gandi.net/en-US/domain/ssl
- Existing `check-ssl.js` monitors ANY certificates (Gandi or external)

**Free Alternatives:**
- Let's Encrypt with certbot or acme.sh (free, automated)
- Cloudflare SSL (free with CDN)
- Your hosting provider may offer free SSL

**Use check-ssl.js for monitoring:**
The existing `check-ssl.js` script monitors SSL status for ALL your domains,
regardless of where the certificate came from (Gandi, Let's Encrypt, etc.).
It provides a quick overview of which domains have SSL and expiration dates.

#### 16. Multi-Organization Management ✨ NEW

```bash
# List all profiles
node manage-profiles.js list

# Add a new profile
node manage-profiles.js add personal YOUR_TOKEN

# Add profile and set as default
node manage-profiles.js add work YOUR_TOKEN --set-default

# Set default profile
node manage-profiles.js default personal

# Show profile details
node manage-profiles.js show personal

# Remove a profile
node manage-profiles.js remove old-profile

# Migrate legacy single token
node manage-profiles.js migrate
```

**Multi-Organization Features:**
- Manage multiple Gandi organizations
- Profile-based token storage (one per org)
- Default profile configuration
- Automatic legacy token migration
- Organization info display

**Profile Storage:**
```
~/.config/gandi/
├── profiles.json           # Profile configuration
└── tokens/
    ├── personal.token      # Token for personal org
    └── work.token          # Token for work org
```

**Using Profiles with Commands:**
All scripts support the `--profile` flag:
```bash
# Use specific profile
node list-domains.js --profile work

# Use default profile (no flag needed)
node list-domains.js

# Create DNS record in specific org
node add-dns-record.js example.com A www 192.0.2.1 --profile personal
```

**Legacy Token Migration:**
If you have an existing `~/.config/gandi/api_token`, run:
```bash
node manage-profiles.js migrate
```
This creates a "default" profile and backs up your legacy token.

**Common Use Cases:**
- Personal + work organizations
- Client account management (agencies)
- Development/staging/production separation
- Family/business domain separation

### From Moltbot

Once configured, you can use natural language:

> "List my Gandi domains"

> "Show DNS records for example.com"

> "Check if yattadone.app is available"

> "When does example.com expire?"

## Configuration

### Default Configuration

Configuration is stored in `gandi-skill/config/domain-checker-defaults.json`:

```json
{
  "tlds": {
    "mode": "extend",
    "defaults": ["com", "net", "org", "info", "io", "dev", "app", "ai", "tech", "co", "biz", "me", "us"],
    "custom": []
  },
  "variations": {
    "enabled": true,
    "patterns": ["hyphenated", "abbreviated", "prefix", "suffix", "numbers"],
    "prefixes": ["get", "my", "the", "try"],
    "suffixes": ["app", "hub", "io", "ly", "ai", "hq"],
    "maxNumbers": 3
  },
  "rateLimit": {
    "maxConcurrent": 3,
    "delayMs": 200,
    "maxRequestsPerMinute": 100
  },
  "limits": {
    "maxTlds": 5,
    "maxVariations": 10
  }
}
```

**TLD Modes:**
- `"extend"` - Use defaults + custom TLDs (merged list)
- `"replace"` - Use only custom TLDs (ignore defaults)

**Rate Limiting:**
- `maxConcurrent` - Max concurrent API requests (default: 3)
- `delayMs` - Minimum delay between requests (default: 200ms)
- `maxRequestsPerMinute` - Hard cap (default: 100, Gandi allows 1000)

**Result Caps:**
- `maxTlds` - Max TLDs to check in suggestions (default: 5)
- `maxVariations` - Max name variations to generate (default: 10)

### Gateway Console Integration (Coming Soon)

Future configuration via Gateway Console ([#3](https://github.com/chrisagiddings/moltbot-gandi-skill/issues/3)):

```yaml
skills:
  entries:
    gandi:
      enabled: true
      config:
        apiToken: "${GANDI_API_TOKEN}"
        domainChecker:
          tlds:
            mode: extend
            custom: ["co.uk", "co.ua"]
          limits:
            maxTlds: 5
            maxVariations: 10
```

See `docs/gateway-config-design.md` for complete architecture.

## API Reference

### Core Functions (gandi-api.js)

Import and use in your own scripts:

```javascript
import { 
  testAuth,
  listDomains,
  getDomain,
  listDnsRecords,
  getDnsRecord,
  checkAvailability,
  generateVariations,
  readDomainCheckerConfig,
  getRateLimiter
} from './gandi-api.js';

// Check domain availability
const results = await checkAvailability(['example.com', 'example.net']);

// Generate name variations
const variations = generateVariations('example', {
  patterns: ['hyphenated', 'prefix', 'suffix'],
  prefixes: ['get', 'my'],
  suffixes: ['app', 'io']
});

// Use rate limiter
const limiter = getRateLimiter();
const result = await limiter.throttle(async () => {
  return await checkAvailability(['example.com']);
});
```

## Troubleshooting

### Token Not Found

```bash
# Verify file exists
ls -la ~/.config/gandi/api_token

# Should show: -rw------- (600 permissions)
```

**Fix:**
```bash
chmod 600 ~/.config/gandi/api_token
```

### Authentication Failed (401)

- Token is incorrect, expired, or revoked
- Token doesn't have required scopes
- Create new token at [Gandi Admin](https://admin.gandi.net/organizations/account/pat)

### Permission Denied (403)

- Token lacks required scopes (add Domain:read, LiveDNS:read)
- Resource belongs to different organization

### Rate Limit Errors (429)

- Automatic rate limiting should prevent this
- If it happens, increase `delayMs` in config
- Reduce `maxConcurrent` to be more conservative

### Domain Not Found (404)

- Domain doesn't exist in your account
- Check domain spelling
- Verify you're using production API (not sandbox)

## Development

### Project Structure

```
moltbot-gandi-skill/
├── README.md                    # This file
├── LICENSE                      # MIT License
├── gandi-skill/
│   ├── SKILL.md                 # Skill documentation
│   ├── config/
│   │   └── domain-checker-defaults.json
│   ├── references/              # API documentation
│   │   ├── api-overview.md
│   │   ├── authentication.md
│   │   ├── domains.md
│   │   ├── livedns.md
│   │   └── setup.md
│   └── scripts/
│       ├── gandi-api.js         # Core API client
│       ├── test-auth.js         # Authentication tester
│       ├── list-domains.js      # Domain lister
│       ├── list-dns.js          # DNS record viewer
│       ├── check-domain.js      # Single domain availability
│       ├── suggest-domains.js   # Smart domain suggestions
│       └── check-ssl.js         # SSL certificate checker
└── docs/
    └── gateway-config-design.md # Gateway Console architecture
```

### Running Tests

```bash
cd gandi-skill/scripts

# Test authentication
node test-auth.js

# Test domain listing
node list-domains.js

# Test DNS operations
node list-dns.js yourdomain.com

# Test availability checking
node check-domain.js example.com
node suggest-domains.js example --tlds com,net
```

### API Documentation

Complete Gandi API documentation is available in `gandi-skill/references/`:
- `api-overview.md` - RESTful API basics
- `authentication.md` - Token creation and security
- `domains.md` - Domain management operations
- `livedns.md` - DNS record management
- `setup.md` - Complete setup walkthrough

## Contributing

Contributions are welcome! This skill follows [Moltbot skill standards](https://github.com/openclaw/openclaw/blob/main/skills/skill-creator/SKILL.md).

**To contribute:**

1. Fork this repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes (follow existing structure and style)
4. Test with a real Gandi account (or sandbox)
5. Commit your changes with conventional commits
6. Push to your branch (`git push origin feature/amazing-feature`)
7. Submit a pull request

**Coding Standards:**
- Use ES modules (`import`/`export`)
- Follow existing code style
- Add JSDoc comments for functions
- Handle errors gracefully
- Include usage examples in scripts
- Update documentation for new features

**Bug Reports:**
- Open an issue with detailed description
- Include error messages and stack traces
- Mention your environment (OS, Node version)
- Provide steps to reproduce

## Roadmap

See [GitHub Issues](https://github.com/chrisagiddings/moltbot-gandi-skill/issues) for planned features and known bugs:

- [#1](https://github.com/chrisagiddings/moltbot-gandi-skill/issues/1) - Multi-organization support (Phase 2)
- [#3](https://github.com/chrisagiddings/moltbot-gandi-skill/issues/3) - Gateway Console configuration
- [#4](https://github.com/chrisagiddings/moltbot-gandi-skill/issues/4) - Domain availability checker ✅ Complete
- [#5](https://github.com/chrisagiddings/moltbot-gandi-skill/issues/5) - Batch domain checking bug
- [#6](https://github.com/chrisagiddings/moltbot-gandi-skill/issues/6) - Rate limiting and result caps ✅ Complete

## License

MIT License - See [LICENSE](LICENSE) for details.

## Links

- **Repository:** https://github.com/chrisagiddings/moltbot-gandi-skill
- **Issues:** https://github.com/chrisagiddings/moltbot-gandi-skill/issues
- **Gandi:** https://www.gandi.net
- **Gandi API Docs:** https://api.gandi.net/docs/
- **Moltbot:** https://github.com/openclaw/openclaw

---

**Note:** This skill is community-created and not officially maintained by Gandi or Moltbot. Use responsibly and at your own discretion.

**API Citizenship:** This skill implements responsible rate limiting (100 requests/min, 10% of Gandi's limit) to ensure good API citizenship. Please maintain these limits when contributing.
