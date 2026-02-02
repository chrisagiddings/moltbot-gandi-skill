#!/usr/bin/env node

/**
 * Check Domain Availability
 * Single domain lookup with pricing and details
 * 
 * Usage:
 *   node check-domain.js example.com
 *   node check-domain.js example  (will add .com if no TLD)
 */

import { checkAvailability } from './gandi-api.js';

const domain = process.argv[2];

if (!domain) {
  console.error('Usage: node check-domain.js <domain>');
  console.error('Example: node check-domain.js example.com');
  process.exit(1);
}

// Add .com if no TLD provided
const domainToCheck = domain.includes('.') ? domain : `${domain}.com`;

console.log(`🔍 Checking availability for: ${domainToCheck}\n`);

try {
  const results = await checkAvailability([domainToCheck]);
  
  if (!results || !results.products || results.products.length === 0) {
    console.log('❌ No results returned from API');
    process.exit(1);
  }
  
  const product = results.products[0];
  
  // Display results
  console.log('Domain:', product.name);
  console.log('');
  
  if (product.status === 'available') {
    console.log('✅ Status: AVAILABLE');
    
    // Show pricing
    if (product.prices) {
      console.log('\n💰 Pricing:');
      product.prices.forEach(price => {
        console.log(`  ${price.duration_unit}: ${price.price_after_taxes} ${price.currency} (+ ${price.taxes} tax)`);
      });
    }
    
    // Show supported features
    if (product.process && product.process.length > 0) {
      console.log('\n📋 Supported Features:');
      product.process.forEach(feature => {
        console.log(`  • ${feature}`);
      });
    }
    
    // Show TLD info
    if (product.tld) {
      console.log('\n🌐 TLD Information:');
      console.log(`  Extension: ${product.tld}`);
    }
    
  } else if (product.status === 'unavailable') {
    console.log('❌ Status: UNAVAILABLE (already registered)');
    
  } else if (product.status === 'pending') {
    console.log('⏳ Status: PENDING (registration in progress)');
    
  } else if (product.status === 'error') {
    console.log('⚠️  Status: ERROR');
    if (product.message) {
      console.log(`   Message: ${product.message}`);
    }
    
  } else {
    console.log(`ℹ️  Status: ${product.status}`);
  }
  
  // Show additional details
  if (product.taxes_included !== undefined) {
    console.log(`\n💵 Taxes included: ${product.taxes_included ? 'Yes' : 'No'}`);
  }
  
} catch (error) {
  console.error('❌ Error checking domain:', error.message);
  if (error.response) {
    console.error('API Response:', error.response);
  }
  process.exit(1);
}
