# Gandi Skill Gateway Config Design

## Overview

Multi-organization support for Gandi skill via Gateway config, following Clawdbot credential patterns.

## Config Structure

### Location
```yaml
skills:
  entries:
    gandi:
      enabled: true
      config:
        # Phase 1: Single token (simple)
        apiToken: "${GANDI_API_TOKEN}"
        apiUrl: "https://api.gandi.net/v5"  # optional override
        
        # Phase 2: Multi-org (optional, overrides apiToken if present)
        organizations:
          - name: "primary"
            label: "Primary Organization"  # human-readable
            apiToken: "${GANDI_TOKEN_PRIMARY}"
            sharingId: "17672a84-e05e-11e7-b536-00163e6dc886"
            default: true
          - name: "secondary"
            label: "Secondary Organization"
            apiToken: "${GANDI_TOKEN_SECONDARY}"
            sharingId: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

### Schema Definition

```typescript
interface GandiSkillConfig {
  // Phase 1: Simple single-token mode
  apiToken?: string;           // PAT or env var reference
  apiUrl?: string;            // Default: https://api.gandi.net/v5
  
  // Phase 2: Multi-org mode (optional)
  organizations?: Array<{
    name: string;             // Machine-readable key (primary, secondary)
    label?: string;           // Human-readable label
    apiToken: string;         // PAT for this org
    sharingId: string;        // Gandi organization UUID
    default?: boolean;        // Default org for operations
  }>;
}
```

## Upgrade Path

### Phase 1 → Phase 2 Migration
When user adds `organizations[]`, scripts detect it and:
1. Ignore `apiToken` (root level)
2. Use `organizations[]` array instead
3. Allow org selection via CLI flags or skill invocation

### Backward Compatibility
- If only `apiToken` present → single-org mode (Phase 1)
- If `organizations[]` present → multi-org mode (Phase 2)
- Both can coexist in config (orgs take precedence)

## Gateway Console Integration

### UI Mockup

**Skills → gandi → Config:**

#### Phase 1 View (Simple)
```
┌─ Gandi API Configuration ────────────────────┐
│ ☑ Enabled                                    │
│                                              │
│ API Token: [****************]  🔒           │
│ API URL:   [https://api.gandi.net/v5]       │
│            (optional override)               │
└──────────────────────────────────────────────┘
```

#### Phase 2 View (Multi-Org)
```
┌─ Gandi API Configuration ────────────────────┐
│ ☑ Enabled                                    │
│                                              │
│ Organizations:                               │
│ ┌──────────────────────────────────────────┐ │
│ │ ● primary (Primary Organization) [DEF]  │ │
│ │   Token: [****************] 🔒           │ │
│ │   Org ID: 17672a84-e05e-11e7-b536-...   │ │
│ │   [ Edit ] [ Remove ]                    │ │
│ ├──────────────────────────────────────────┤ │
│ │ ○ secondary (Secondary Organization)     │ │
│ │   Token: [****************] 🔒           │ │
│ │   Org ID: xxxxxxxx-xxxx-xxxx-xxxx-...    │ │
│ │   [ Edit ] [ Remove ] [ Set Default ]    │ │
│ └──────────────────────────────────────────┘ │
│ [ + Add Organization ]                       │
└──────────────────────────────────────────────┘
```

## Script Usage

### Reading Config (Node.js)

```javascript
import { readGatewayConfig } from '@clawdbot/gateway-config';

const config = await readGatewayConfig();
const gandiConfig = config.skills?.entries?.gandi?.config || {};

// Phase 1: Simple mode
if (gandiConfig.organizations?.length) {
  // Multi-org mode
  const defaultOrg = gandiConfig.organizations.find(o => o.default) 
    || gandiConfig.organizations[0];
  
  console.log(`Using org: ${defaultOrg.label || defaultOrg.name}`);
  const token = defaultOrg.apiToken;
  const sharingId = defaultOrg.sharingId;
  
  // Use Gandi API with sharing_id parameter
  await gandiApi('/domains', { sharing_id: sharingId }, token);
} else {
  // Single-token mode (fallback)
  const token = gandiConfig.apiToken || process.env.GANDI_API_TOKEN;
  await gandiApi('/domains', {}, token);
}
```

### CLI Arguments (Future)

```bash
# Default org
node list-domains.js

# Specific org by name
node list-domains.js --org=secondary

# Specific org by sharing_id
node list-domains.js --sharing-id=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

## Gandi API Integration

### sharing_id Parameter
Most Gandi API endpoints accept an optional `sharing_id` query parameter:

```javascript
// Single-org (no sharing_id needed)
GET https://api.gandi.net/v5/domain/domains
Authorization: Bearer <token>

// Multi-org (specify sharing_id)
GET https://api.gandi.net/v5/domain/domains?sharing_id=17672a84-e05e-11e7-b536-00163e6dc886
Authorization: Bearer <token>
```

### Organization Discovery
Scripts can discover available orgs via:

```javascript
GET https://api.gandi.net/v5/organization/organizations
Authorization: Bearer <token>

// Response:
[
  {
    "id": "17672a84-e05e-11e7-b536-00163e6dc886",
    "name": "chrisagiddings",
    "type": "individual",
    ...
  }
]
```

## Security Considerations

1. **Token Storage:**
   - Use env var references (`${GANDI_TOKEN_PRIMARY}`) in config
   - Never commit raw tokens to git
   - Gateway Console marks token fields as `sensitive: true`

2. **Token Permissions:**
   - Each PAT is scoped to one organization
   - Permissions are per-token (view/manage domains/DNS/etc.)
   - Scripts honor token restrictions

3. **File Permissions:**
   - Config stored in `~/.clawdbot/config.yaml` (600 permissions)
   - Gateway validates token format before saving

## Testing Strategy

### Phase 1 (Single Token)
- ✅ Test with `~/.config/gandi/api_token` (file-based)
- ✅ Test with Gateway config `apiToken` field
- ✅ Test env var fallback (`GANDI_API_TOKEN`)

### Phase 2 (Multi-Org)
- Test with 2+ organizations configured
- Test default org selection
- Test org override via CLI flags
- Test `sharing_id` parameter in API calls
- Test org discovery workflow

## Implementation Phases

### Phase 1 (Current - MVP)
- [x] File-based token (`~/.config/gandi/api_token`)
- [x] Basic domain/DNS scripts
- [ ] Gateway config support (single token)
- [ ] Environment variable fallback

### Phase 2 (Multi-Org)
- [ ] Config schema for `organizations[]`
- [ ] Org selection logic in scripts
- [ ] CLI flags for org override
- [ ] Gateway Console UI mockups
- [ ] Migration guide (Phase 1 → Phase 2)

### Phase 3 (Polish)
- [ ] Org auto-discovery helper
- [ ] Default org auto-select
- [ ] Org aliasing (shorthand names)
- [ ] Skill docs update

## Example Configs

### Minimal (Phase 1)
```yaml
skills:
  entries:
    gandi:
      enabled: true
      config:
        apiToken: "${GANDI_API_TOKEN}"
```

### Full Multi-Org (Phase 2)
```yaml
skills:
  entries:
    gandi:
      enabled: true
      config:
        organizations:
          - name: "personal"
            label: "Personal Domains"
            apiToken: "${GANDI_TOKEN_PERSONAL}"
            sharingId: "17672a84-e05e-11e7-b536-00163e6dc886"
            default: true
          - name: "business"
            label: "Business Domains"
            apiToken: "${GANDI_TOKEN_BUSINESS}"
            sharingId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
          - name: "client"
            label: "Client Domains"
            apiToken: "${GANDI_TOKEN_CLIENT}"
            sharingId: "ffffffff-ffff-ffff-ffff-ffffffffffff"
```

## References

- Gandi API Docs: https://api.gandi.net/docs/
- Clawdbot Config Schema: `gateway config.schema`
- Discord Multi-Account Pattern: `channels.discord.accounts`
- Skills Config Pattern: `skills.entries.*.config`
