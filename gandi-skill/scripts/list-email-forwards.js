#!/usr/bin/env node

/**
 * List email forwards for a domain
 * 
 * Usage:
 *   node list-email-forwards.js <domain>
 * 
 * Examples:
 *   node list-email-forwards.js example.com
 */

import {
  getDomain,
  listEmailForwards
} from './gandi-api.js';

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length < 1) {
  console.error('Usage: node list-email-forwards.js <domain>');
  console.error('');
  console.error('Examples:');
  console.error('  node list-email-forwards.js example.com');
  process.exit(1);
}

const domain = args[0];

// Main function
async function main() {
  try {
    console.log(`📧 Listing email forwards for ${domain}...`);
    console.log('');
    
    // Check if domain has email forwarding service
    let domainInfo;
    try {
      domainInfo = await getDomain(domain);
    } catch (err) {
      if (err.statusCode === 404) {
        console.error(`❌ Domain ${domain} not found in your account`);
        process.exit(1);
      }
      throw err;
    }
    
    // Check if email forwarding service is active
    const hasEmailService = domainInfo.services?.some(s => 
      s === 'email' || s.includes('forward') || s.includes('mail')
    );
    
    if (!hasEmailService) {
      console.log('⚠️  Warning: Email forwarding service may not be active');
      console.log('   If you encounter errors, enable email forwarding at:');
      console.log('   https://admin.gandi.net/');
      console.log('');
    }
    
    // List email forwards
    let forwards;
    try {
      forwards = await listEmailForwards(domain);
    } catch (err) {
      if (err.statusCode === 404) {
        console.log('📭 No email forwards configured for this domain.');
        console.log('');
        console.log('💡 To create an email forward:');
        console.log(`   node add-email-forward.js ${domain} hello destination@example.com`);
        console.log('');
        console.log('💡 To set up a catch-all:');
        console.log(`   node add-email-forward.js ${domain} @ admin@example.com`);
        return;
      } else if (err.statusCode === 403) {
        console.error('❌ Permission denied.');
        console.error('');
        console.error('Possible causes:');
        console.error('  - Email forwarding service not enabled for this domain');
        console.error('  - API token lacks Email: read scope');
        console.error('');
        console.error('To enable email forwarding:');
        console.error('  1. Go to https://admin.gandi.net/');
        console.error('  2. Select your domain');
        console.error('  3. Enable Email Forwarding service');
        process.exit(1);
      }
      throw err;
    }
    
    if (!forwards || forwards.length === 0) {
      console.log('📭 No email forwards configured for this domain.');
      console.log('');
      console.log('💡 To create an email forward:');
      console.log(`   node add-email-forward.js ${domain} hello destination@example.com`);
      return;
    }
    
    // Display forwards
    console.log(`📧 Email Forwards (${forwards.length} total):`);
    console.log('');
    
    // Separate catch-all from regular forwards
    const catchAll = forwards.filter(f => f.source === '@' || f.source === '*');
    const regular = forwards.filter(f => f.source !== '@' && f.source !== '*');
    
    // Show catch-all first if it exists
    if (catchAll.length > 0) {
      console.log('🌐 Catch-All Forward:');
      catchAll.forEach(forward => {
        console.log(`   @${domain} → ${forward.destinations.join(', ')}`);
        if (forward.enabled === false) {
          console.log('   Status: ❌ DISABLED');
        }
      });
      console.log('');
    }
    
    // Show regular forwards
    if (regular.length > 0) {
      console.log('📬 Regular Forwards:');
      regular.forEach(forward => {
        console.log(`   ${forward.source}@${domain} → ${forward.destinations.join(', ')}`);
        if (forward.enabled === false) {
          console.log('   Status: ❌ DISABLED');
        }
      });
      console.log('');
    }
    
    console.log('💡 To add a forward:');
    console.log(`   node add-email-forward.js ${domain} <mailbox> <destination>`);
    console.log('');
    console.log('💡 To update a forward:');
    console.log(`   node update-email-forward.js ${domain} <mailbox> <new-destination>`);
    console.log('');
    console.log('💡 To delete a forward:');
    console.log(`   node delete-email-forward.js ${domain} <mailbox>`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.statusCode === 401) {
      console.error('');
      console.error('Authentication failed. Check your API token.');
    } else if (error.statusCode === 403) {
      console.error('');
      console.error('Permission denied. Ensure your API token has Email: read scope.');
      console.error('Create a new token at: https://admin.gandi.net/organizations/account/pat');
    } else if (error.response) {
      console.error('API response:', JSON.stringify(error.response, null, 2));
    }
    
    process.exit(1);
  }
}

main();
