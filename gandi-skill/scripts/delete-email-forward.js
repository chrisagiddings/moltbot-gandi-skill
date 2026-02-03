#!/usr/bin/env node

/**
 * Delete email forward for a domain
 * 
 * Usage:
 *   node delete-email-forward.js <domain> <mailbox> [--confirm]
 * 
 * Examples:
 *   node delete-email-forward.js example.com hello --confirm
 *   node delete-email-forward.js example.com old-alias
 */

import {
  getEmailForward,
  deleteEmailForward
} from './gandi-api.js';
import readline from 'readline';

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('Usage: node delete-email-forward.js <domain> <mailbox> [--confirm]');
  console.error('');
  console.error('Examples:');
  console.error('  node delete-email-forward.js example.com hello --confirm');
  console.error('  node delete-email-forward.js example.com old-alias');
  console.error('');
  console.error('⚠️  Deleting email forwards will stop forwarding immediately!');
  process.exit(1);
}

const domain = args[0];
const mailbox = args[1];
const autoConfirm = args.includes('--confirm');

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
    const isCatchAll = mailbox === '@' || mailbox === '*';
    const displayName = isCatchAll ? `@${domain}` : `${mailbox}@${domain}`;
    
    console.log(`🗑️  Deleting email forward for ${domain}...`);
    console.log('');
    
    // Check if forward exists
    let existing;
    try {
      existing = await getEmailForward(domain, mailbox);
    } catch (err) {
      if (err.statusCode === 404) {
        console.error(`❌ Email forward not found for ${displayName}`);
        console.error('');
        console.error('📊 To view all forwards:');
        console.error(`   node list-email-forwards.js ${domain}`);
        process.exit(1);
      }
      throw err;
    }
    
    console.log('📋 Forward to be deleted:');
    console.log(`   From: ${displayName}`);
    console.log(`   To: ${existing.destinations.join(', ')}`);
    console.log('');
    
    // Extra warning for catch-all
    if (isCatchAll) {
      console.log('⚠️  WARNING: This is a CATCH-ALL forward!');
      console.log('   Deleting it will stop forwarding all unmatched emails.');
      console.log('');
    }
    
    // Confirmation
    if (!autoConfirm) {
      console.log('⚠️  Deleting this forward will stop email forwarding immediately.');
      console.log('   Emails sent to this address will bounce after deletion.');
      console.log('');
      
      const confirmed = await confirm('Are you sure you want to delete this forward? (yes/no): ');
      
      if (!confirmed) {
        console.log('❌ Deletion cancelled.');
        process.exit(0);
      }
      console.log('');
    }
    
    // Delete the forward
    console.log('🗑️  Deleting...');
    await deleteEmailForward(domain, mailbox);
    
    console.log('✅ Email forward deleted successfully!');
    console.log('');
    console.log(`   ${displayName} is no longer forwarded`);
    console.log('');
    console.log('⚠️  Emails sent to this address will now bounce.');
    console.log('');
    console.log('💡 To recreate this forward:');
    console.log(`   node add-email-forward.js ${domain} ${mailbox} <destination>`);
    console.log('');
    console.log('📊 To view remaining forwards:');
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
    } else if (error.response) {
      console.error('API response:', JSON.stringify(error.response, null, 2));
    }
    
    process.exit(1);
  }
}

main();
