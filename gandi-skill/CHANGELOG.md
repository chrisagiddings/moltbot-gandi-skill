# Changelog

All notable changes to Gandi Skill will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.6] - 2026-02-28

### Fixed
- Allow underscores in DNS record names for service records (Fixes #24)
  - DKIM records: `resend._domainkey`, `_domainkey.mail`
  - DMARC records: `_dmarc`, `_dmarc.subdomain`
  - SRV records: `_imap._tcp`, `_smtp._tcp`
  - Other service records with underscore prefixes
- Updated `sanitizeRecordName()` to detect underscore labels
- Maintains strict validation for regular hostnames (no underscores)
- Added comprehensive test suite for underscore validation

### Changed
- Record name validation now context-aware (service records vs hostnames)
- Regex pattern detects any label starting with `_` and allows underscores

## [0.2.5] - 2026-02-09

### Previous Releases
See Git commit history for changes before 0.2.6.
