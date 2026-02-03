#!/usr/bin/env node

/**
 * Add email forward for a domain
 * 
 * Usage:
 *   node add-email-forward.js <domain> <mailbox> <destination> [additional-destinations...]
 * 
 * Examples:
 *   node add-email-forward.js example.com hello hello@gmail.com
 *   node add-email-forward.js example.com support support@gmail.com support@company.com
 *   node add-email-forward.js example.com @ admin@gmail.com
 */

import {
  getDomain,
  getEmailForward,
  createEmailForward
} from './gandi-api.js';

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length < 3) {
  console.error('Usage: node add-email-forward.js <domain> <mailbox> <destination> [additional-destinations...]');
  console.error('');
  console.error('Examples:');
  console.error('  node add-email-forward.js example.com hello hello@gmail.com');
  console.error('  node add-email-forward.js example.com support support@gmail.com team@company.com');
  console.error('  node add-email-forward.js example.com @ admin@gmail.com  # Catch-all');
  console.error('');
  console.error('Mailbox options:');
  console.error('  - Use any name (e.g., hello, support, info)');
  console.error('  - Use @ for catch-all (forwards all unmatched emails)');
  console.error('');
  console.error('⚠️  Catch-all forwards can receive spam. Use with caution.');
  process.exit(1);
}

const domain = args[0];
const mailbox = args[1];
const destinations = args.slice(2);

// Validate email addresses
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Validate mailbox name
function isValidMailbox(name) {
  if (name === '@' || name === '*') return true; // Catch-all
  return /^[a-z0-9._-]+$/i.test(name);
}

// Main function
async function main() {
  try {
    // Validate mailbox name
    if (!isValidMailbox(mailbox)) {
      console.error('❌ Invalid mailbox name. Use alphanumeric characters, dots, hyphens, or @ for catch-all.');
      process.exit(1);
    }
    
    // Validate destination emails
    for (const dest of destinations) {
      if (!isValidEmail(dest)) {
        console.error(`❌ Invalid email address: ${dest}`);
        process.exit(1);
      }
    }
    
    const isCatchAll = mailbox === '@' || mailbox === '*';
    const displayName = isCatchAll ? `@${domain}` : `${mailbox}@${domain}`;
    
    console.log(`📧 Creating email forward for ${domain}...`);
    console.log('');
    console.log(`   From: ${displayName}`);
    console.log(`   To: ${destinations.join(', ')}`);
    console.log('');
    
    // Check if domain exists
    try {
      await getDomain(domain);
    } catch (err) {
      if (err.statusCode === 404) {
        console.error(`❌ Domain ${domain} not found in your account`);
        process.exit(1);
      }
      throw err;
    }
    
    // Check if forward already exists
    try {
      const existing = await getEmailForward(domain, mailbox);
      console.error(`❌ Email forward already exists for ${displayName}`);
      console.error(`   Current destinations: ${existing.destinations.join(', ')}`);
      console.error('');
      console.error('💡 To update this forward, use:');
      console.error(`   node update-email-forward.js ${domain} ${mailbox} ${destinations.join(' ')}`);
      process.exit(1);
    } catch (err) {
      if (err.statusCode !== 404) {
        throw err;
      }
      // Forward doesn't exist, continue with creation
    }
    
    // Warn about catch-all
    if (isCatchAll) {
      console.log('⚠️  WARNING: Catch-all forwards receive ALL unmatched emails');
      console.log('   This can include spam and unwanted messages.');
      console.log('   Consider using specific forwards instead (hello@, support@, etc.)');
      console.log('');
    }
    
    // Create the forward
    console.log('📤 Creating email forward...');
    const result = await createEmailForward(domain, mailbox, destinations);
    
    console.log('✅ Email forward created successfully!');
    console.log('');
    console.log('📋 Forward Details:');
    console.log(`   From: ${displayName}`);
    console.log(`   To: ${destinations.join(', ')}`);
    console.log('');
    
    if (isCatchAll) {
      console.log('🌐 Catch-all forward is now active');
      console.log('   All emails to unknown addresses will be forwarded');
      console.log('');
    }
    
    console.log('💡 Next steps:');
    console.log('   1. Send a test email to verify forwarding works');
    console.log(`   2. Check MX records if emails aren't being received`);
    console.log(`   3. Configure SPF records for deliverability`);
    console.log('');
    console.log('📊 To view all forwards:');
    console.log(`   node list-email-forwards.js ${domain}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.statusCode === 401) {
      console.error('');
      console.error('Authentication failed. Check your API token.');
    } else if (error.statusCode === 403) {
      console.error('');
      console.error('Permission denied. Possible causes:');
      console.error('  - API token lacks Email: write scope');
      console.error('  - Email forwarding service not enabled for this domain');
      console.error('');
      console.error('Enable email forwarding at: https://admin.gandi.net/');
      console.error('Create new token with Email: write at: https://admin.gandi.net/organizations/account/pat');
    } else if (error.statusCode === 409) {
      console.error('');
      console.error('Forward already exists. Use update-email-forward.js to modify it.');
    } else if (error.statusCode === 422) {
      console.error('');
      console.error('Validation failed. Check:');
      console.error('  - Email addresses are valid');
      console.error('  - Mailbox name is valid');
      console.error('  - Email forwarding service is enabled');
      if (error.response) {
        console.error('Details:', JSON.stringify(error.response, null, 2));
      }
    } else if (error.response) {
      console.error('API response:', JSON.stringify(error.response, null, 2));
    }
    
    process.exit(1);
  }
}

main();
