#!/usr/bin/env node

/**
 * Delete DNS record via Gandi LiveDNS API
 * 
 * Usage:
 *   node delete-dns-record.js <domain> <type> <name> [--confirm]
 * 
 * Examples:
 *   node delete-dns-record.js example.com A temp --confirm
 *   node delete-dns-record.js example.com CNAME staging --confirm
 *   node delete-dns-record.js example.com TXT _verification --confirm
 */

import {
  deleteDnsRecord,
  getDnsRecord,
  createSnapshot
} from './gandi-api.js';
import readline from 'readline';

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length < 3) {
  console.error('Usage: node delete-dns-record.js <domain> <type> <name> [--confirm]');
  console.error('');
  console.error('Examples:');
  console.error('  node delete-dns-record.js example.com A temp --confirm');
  console.error('  node delete-dns-record.js example.com CNAME staging --confirm');
  console.error('  node delete-dns-record.js example.com TXT _verification --confirm');
  console.error('');
  console.error('⚠️  CAUTION: Deleting DNS records can break websites and email!');
  console.error('Use --confirm to skip the confirmation prompt.');
  process.exit(1);
}

const domain = args[0];
const type = args[1].toUpperCase();
const name = args[2];
const autoConfirm = args.includes('--confirm');

// Validate inputs
if (!domain || !type || !name) {
  console.error('❌ Error: Missing required arguments');
  process.exit(1);
}

// Critical records that require extra warning
const criticalRecords = ['@', 'www', 'mail'];
const criticalTypes = ['NS', 'MX', 'SOA'];

const isCritical = criticalRecords.includes(name) || criticalTypes.includes(type);

// Prompt for confirmation
function confirm(message) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question(message, (answer) => {
      rl.close();
      resolve(answer.toLowerCase().startsWith('y'));
    });
  });
}

// Main function
async function main() {
  try {
    console.log(`🗑️  Deleting DNS record for ${domain}`);
    console.log(`   Type: ${type}`);
    console.log(`   Name: ${name}`);
    console.log('');
    
    // Fetch current record to show what will be deleted
    let currentRecord;
    try {
      currentRecord = await getDnsRecord(domain, name, type);
      console.log('📋 Current record:');
      console.log(`   Values: ${currentRecord.rrset_values.join(', ')}`);
      console.log(`   TTL: ${currentRecord.rrset_ttl}`);
      console.log('');
    } catch (err) {
      if (err.statusCode === 404) {
        console.error('❌ Error: Record not found');
        console.error(`   No ${type} record named "${name}" exists for ${domain}`);
        process.exit(1);
      }
      throw err;
    }
    
    // Extra warning for critical records
    if (isCritical) {
      console.log('⚠️ ⚠️ ⚠️  WARNING: CRITICAL RECORD ⚠️ ⚠️ ⚠️');
      console.log('');
      console.log('This record is critical for your domain operation!');
      console.log('Deleting it may cause:');
      if (name === '@' || name === 'www') {
        console.log('  - Website outage');
        console.log('  - Broken links and bookmarks');
      }
      if (type === 'MX' || name === 'mail') {
        console.log('  - Email delivery failures');
        console.log('  - Inability to receive emails');
      }
      if (type === 'NS') {
        console.log('  - Complete DNS resolution failure');
        console.log('  - Domain becoming unreachable');
      }
      console.log('');
    }
    
    // Confirm deletion
    if (!autoConfirm) {
      console.log('⚠️  This action cannot be undone!');
      console.log('');
      const confirmed = await confirm('Are you sure you want to delete this record? (yes/no): ');
      
      if (!confirmed) {
        console.log('❌ Deletion cancelled.');
        process.exit(0);
      }
      console.log('');
    }
    
    // Create automatic snapshot before deleting
    const snapshotName = `Before deleting ${name}.${domain} ${type} - ${new Date().toISOString()}`;
    console.log('📸 Creating automatic snapshot...');
    try {
      const snapshot = await createSnapshot(domain, snapshotName);
      console.log(`✅ Snapshot created: ${snapshot.id || 'success'}`);
    } catch (snapErr) {
      console.warn('⚠️  Could not create snapshot:', snapErr.message);
      
      if (!autoConfirm) {
        const proceedAnyway = await confirm('Continue without snapshot? (yes/no): ');
        if (!proceedAnyway) {
          console.log('❌ Deletion cancelled.');
          process.exit(0);
        }
      }
    }
    console.log('');
    
    // Delete the record
    console.log('🗑️  Deleting record...');
    const result = await deleteDnsRecord(domain, name, type);
    
    if (result.statusCode === 204) {
      console.log('✅ DNS record successfully deleted!');
      console.log('');
      console.log('⏱️  DNS Propagation:');
      console.log('   - Gandi nameservers: immediate');
      console.log('   - Local cache: ~5 minutes');
      console.log(`   - Global: up to ${currentRecord.rrset_ttl} seconds (old TTL)`);
      console.log('');
      console.log('💡 To restore this record, you can:');
      console.log('   1. Restore from the snapshot created above');
      console.log('   2. Recreate it manually using add-dns-record.js');
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
      console.error('Domain or record not found.');
    } else if (error.response) {
      console.error('API response:', JSON.stringify(error.response, null, 2));
    }
    
    process.exit(1);
  }
}

main();
