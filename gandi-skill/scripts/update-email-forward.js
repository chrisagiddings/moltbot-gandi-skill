#!/usr/bin/env node

/**
 * Update email forward for a domain
 * 
 * Usage:
 *   node update-email-forward.js <domain> <mailbox> <destination> [additional-destinations...]
 * 
 * Examples:
 *   node update-email-forward.js example.com hello newemail@gmail.com
 *   node update-email-forward.js example.com support support@gmail.com backup@company.com
 */

import {
  getEmailForward,
  updateEmailForward
} from './gandi-api.js';

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length < 3) {
  console.error('Usage: node update-email-forward.js <domain> <mailbox> <destination> [additional-destinations...]');
  console.error('');
  console.error('Examples:');
  console.error('  node update-email-forward.js example.com hello newemail@gmail.com');
  console.error('  node update-email-forward.js example.com support support@gmail.com backup@company.com');
  process.exit(1);
}

const domain = args[0];
const mailbox = args[1];
const destinations = args.slice(2);

// Validate email addresses
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Main function
async function main() {
  try {
    // Validate destination emails
    for (const dest of destinations) {
      if (!isValidEmail(dest)) {
        console.error(`❌ Invalid email address: ${dest}`);
        process.exit(1);
      }
    }
    
    const isCatchAll = mailbox === '@' || mailbox === '*';
    const displayName = isCatchAll ? `@${domain}` : `${mailbox}@${domain}`;
    
    console.log(`📧 Updating email forward for ${domain}...`);
    console.log('');
    
    // Check if forward exists
    let existing;
    try {
      existing = await getEmailForward(domain, mailbox);
    } catch (err) {
      if (err.statusCode === 404) {
        console.error(`❌ Email forward not found for ${displayName}`);
        console.error('');
        console.error('💡 To create a new forward, use:');
        console.error(`   node add-email-forward.js ${domain} ${mailbox} ${destinations.join(' ')}`);
        console.error('');
        console.error('📊 To view all forwards:');
        console.error(`   node list-email-forwards.js ${domain}`);
        process.exit(1);
      }
      throw err;
    }
    
    console.log('📋 Current Forward:');
    console.log(`   From: ${displayName}`);
    console.log(`   To: ${existing.destinations.join(', ')}`);
    console.log('');
    console.log('📋 New Forward:');
    console.log(`   From: ${displayName}`);
    console.log(`   To: ${destinations.join(', ')}`);
    console.log('');
    
    // Update the forward
    console.log('📤 Updating email forward...');
    await updateEmailForward(domain, mailbox, destinations);
    
    console.log('✅ Email forward updated successfully!');
    console.log('');
    console.log('📋 Updated Forward:');
    console.log(`   From: ${displayName}`);
    console.log(`   To: ${destinations.join(', ')}`);
    console.log('');
    console.log('💡 Send a test email to verify the new destination works.');
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
      console.error('Permission denied. Ensure your API token has Email: write scope.');
      console.error('Create a new token at: https://admin.gandi.net/organizations/account/pat');
    } else if (error.statusCode === 404) {
      console.error('');
      console.error('Forward not found. Check the mailbox name.');
    } else if (error.statusCode === 422) {
      console.error('');
      console.error('Validation failed. Check that email addresses are valid.');
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
