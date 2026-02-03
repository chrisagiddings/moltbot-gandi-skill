#!/usr/bin/env node

/**
 * Add or update DNS record via Gandi LiveDNS API
 * 
 * Usage:
 *   node add-dns-record.js <domain> <type> <name> <value> [ttl]
 * 
 * Examples:
 *   node add-dns-record.js example.com A www 192.0.2.1
 *   node add-dns-record.js example.com CNAME blog example.com. 3600
 *   node add-dns-record.js example.com MX @ "10 mail.example.com."
 *   node add-dns-record.js example.com TXT @ "v=spf1 include:_spf.google.com ~all"
 */

import {
  createDnsRecord,
  getDnsRecord,
  validateRecordValue,
  isValidTTL,
  createSnapshot
} from './gandi-api.js';

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length < 4) {
  console.error('Usage: node add-dns-record.js <domain> <type> <name> <value> [ttl]');
  console.error('');
  console.error('Examples:');
  console.error('  node add-dns-record.js example.com A www 192.0.2.1');
  console.error('  node add-dns-record.js example.com CNAME blog example.com. 3600');
  console.error('  node add-dns-record.js example.com MX @ "10 mail.example.com."');
  console.error('  node add-dns-record.js example.com TXT _verification "token123"');
  console.error('');
  console.error('Common record types: A, AAAA, CNAME, MX, TXT, NS, SRV, CAA');
  console.error('Use @ for root domain, e.g., example.com A @ 192.0.2.1');
  console.error('');
  console.error('TTL defaults to 10800 seconds (3 hours) if not specified.');
  console.error('Valid TTL range: 300 (5 min) to 2592000 (30 days)');
  process.exit(1);
}

const domain = args[0];
const type = args[1].toUpperCase();
const name = args[2];
const value = args[3];
const ttl = args[4] ? parseInt(args[4], 10) : 10800;

// Validate inputs
if (!domain || !type || !name || !value) {
  console.error('❌ Error: Missing required arguments');
  process.exit(1);
}

if (!isValidTTL(ttl)) {
  console.error(`❌ Error: Invalid TTL ${ttl}. Must be between 300 and 2592000 seconds.`);
  process.exit(1);
}

const validation = validateRecordValue(type, value);
if (!validation.valid) {
  console.error(`❌ Error: ${validation.error}`);
  process.exit(1);
}

// Main function
async function main() {
  try {
    console.log(`📝 Adding/updating DNS record for ${domain}`);
    console.log(`   Type: ${type}`);
    console.log(`   Name: ${name}`);
    console.log(`   Value: ${value}`);
    console.log(`   TTL: ${ttl} seconds`);
    console.log('');
    
    // Check if record already exists
    let recordExists = false;
    try {
      const existing = await getDnsRecord(domain, name, type);
      recordExists = true;
      console.log('⚠️  Record already exists:');
      console.log(`   Current values: ${existing.rrset_values.join(', ')}`);
      console.log(`   Current TTL: ${existing.rrset_ttl}`);
      console.log('');
      console.log('⚠️  This will REPLACE the existing record!');
      console.log('');
      
      // Create automatic snapshot before updating
      const snapshotName = `Before updating ${name}.${domain} ${type} - ${new Date().toISOString()}`;
      console.log('📸 Creating automatic snapshot...');
      try {
        const snapshot = await createSnapshot(domain, snapshotName);
        console.log(`✅ Snapshot created: ${snapshot.id || 'success'}`);
      } catch (snapErr) {
        console.warn('⚠️  Could not create snapshot (continuing anyway):', snapErr.message);
      }
      console.log('');
    } catch (err) {
      if (err.statusCode !== 404) {
        throw err;
      }
      // Record doesn't exist, will be created
      console.log('✨ Creating new record...');
      console.log('');
    }
    
    // Create/update the record
    const result = await createDnsRecord(domain, name, type, [value], ttl);
    
    if (result.statusCode === 201 || result.statusCode === 204) {
      console.log('✅ DNS record successfully ' + (recordExists ? 'updated' : 'created') + '!');
      console.log('');
      console.log('⏱️  DNS Propagation:');
      console.log('   - Gandi nameservers: immediate');
      console.log('   - Local cache: ~5 minutes');
      console.log(`   - Global: up to ${ttl} seconds (current TTL)`);
      console.log('');
      console.log('🔍 Verify with:');
      console.log(`   dig ${name === '@' ? domain : name + '.' + domain} ${type}`);
      console.log(`   dig @ns1.gandi.net ${name === '@' ? domain : name + '.' + domain} ${type}`);
    } else {
      console.log(`⚠️  Unexpected response: HTTP ${result.statusCode}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.statusCode === 401) {
      console.error('');
      console.error('Authentication failed. Check your API token.');
    } else if (error.statusCode === 403) {
      console.error('');
      console.error('Permission denied. Ensure your API token has LiveDNS: write scope.');
      console.error('Create a new token at: https://admin.gandi.net/organizations/account/pat');
    } else if (error.statusCode === 404) {
      console.error('');
      console.error('Domain not found or not using Gandi LiveDNS.');
    } else if (error.response) {
      console.error('API response:', JSON.stringify(error.response, null, 2));
    }
    
    process.exit(1);
  }
}

main();
