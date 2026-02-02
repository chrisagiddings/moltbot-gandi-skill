#!/usr/bin/env node

/**
 * Domain Suggestion Tool
 * Smart disambiguation with TLD variations and name alternatives
 * 
 * Usage:
 *   node suggest-domains.js example
 *   node suggest-domains.js example.com  (will extract base name)
 *   node suggest-domains.js example --tlds com,net,org
 *   node suggest-domains.js example --no-variations
 */

import { checkAvailability, generateVariations, readDomainCheckerConfig } from './gandi-api.js';

// Parse arguments
const args = process.argv.slice(2);
if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  console.log('Usage: node suggest-domains.js <domain> [options]');
  console.log('');
  console.log('Options:');
  console.log('  --tlds <list>        Comma-separated TLD list (e.g., com,net,org)');
  console.log('  --no-variations      Skip name variations, only check TLDs');
  console.log('  --variations-only    Skip exact TLD matches, only show variations');
  console.log('  --json               Output as JSON');
  console.log('');
  console.log('Examples:');
  console.log('  node suggest-domains.js example');
  console.log('  node suggest-domains.js example.com --tlds com,net,io');
  console.log('  node suggest-domains.js example --no-variations');
  process.exit(0);
}

const input = args[0];
const flags = {
  tlds: args.includes('--tlds') ? args[args.indexOf('--tlds') + 1].split(',') : null,
  noVariations: args.includes('--no-variations'),
  variationsOnly: args.includes('--variations-only'),
  json: args.includes('--json')
};

// Extract base name (remove TLD if present)
const baseName = input.includes('.') ? input.split('.')[0] : input;

// Load config
const config = readDomainCheckerConfig();

// Determine TLD list
let tlds = [];
if (flags.tlds) {
  tlds = flags.tlds;
} else {
  const tldConfig = config.tlds;
  if (tldConfig.mode === 'replace' && tldConfig.custom.length > 0) {
    tlds = tldConfig.custom;
  } else {
    tlds = [...tldConfig.defaults, ...tldConfig.custom];
  }
}

if (!flags.json) {
  console.log(`🔍 Checking availability for: ${baseName}\n`);
  console.log(`📊 Checking ${tlds.length} TLDs${flags.noVariations ? '' : ' and generating variations'}...\n`);
}

try {
  const results = {
    exact: [],
    variations: {}
  };
  
  // Check exact matches (different TLDs)
  if (!flags.variationsOnly) {
    const exactDomains = tlds.map(tld => `${baseName}.${tld}`);
    
    // Batch check (API supports multiple domains)
    const batchSize = config.rateLimit?.maxConcurrent || 10;
    const delayMs = config.rateLimit?.delayMs || 100;
    
    for (let i = 0; i < exactDomains.length; i += batchSize) {
      const batch = exactDomains.slice(i, i + batchSize);
      const batchResults = await checkAvailability(batch);
      
      if (batchResults && batchResults.products) {
        batchResults.products.forEach(product => {
          results.exact.push({
            domain: product.name,
            available: product.status === 'available',
            status: product.status,
            price: product.prices ? `${product.prices[0].price_after_taxes} ${product.prices[0].currency}` : null,
            tld: product.tld
          });
        });
      }
      
      // Rate limiting delay between batches
      if (i + batchSize < exactDomains.length && delayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  
  // Generate and check variations
  if (!flags.noVariations && config.variations?.enabled) {
    const variations = generateVariations(baseName, config.variations);
    
    for (const [pattern, names] of Object.entries(variations)) {
      if (names.length === 0) continue;
      
      results.variations[pattern] = [];
      
      // For each variation, check with primary TLDs
      const primaryTlds = flags.tlds || config.tlds.defaults.slice(0, 3); // Default: com, net, org
      
      for (const name of names) {
        const variantDomains = primaryTlds.map(tld => `${name}.${tld}`);
        const variantResults = await checkAvailability(variantDomains);
        
        if (variantResults && variantResults.products) {
          variantResults.products.forEach(product => {
            if (product.status === 'available') {
              results.variations[pattern].push({
                domain: product.name,
                available: true,
                status: product.status,
                price: product.prices ? `${product.prices[0].price_after_taxes} ${product.prices[0].currency}` : null,
                tld: product.tld
              });
            }
          });
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, config.rateLimit?.delayMs || 100));
      }
    }
  }
  
  // Output results
  if (flags.json) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    displayResults(results, flags);
  }
  
} catch (error) {
  console.error('❌ Error:', error.message);
  if (error.response) {
    console.error('API Response:', error.response);
  }
  process.exit(1);
}

/**
 * Display results in human-readable format
 */
function displayResults(results, flags) {
  // Show exact matches
  if (!flags.variationsOnly && results.exact.length > 0) {
    console.log('═══════════════════════════════════════════════════════');
    console.log('📋 EXACT MATCHES (Different TLDs)');
    console.log('═══════════════════════════════════════════════════════\n');
    
    const available = results.exact.filter(r => r.available);
    const unavailable = results.exact.filter(r => !r.available);
    
    if (available.length > 0) {
      console.log('✅ Available:\n');
      available.forEach(r => {
        console.log(`  ${r.domain.padEnd(30)} ${r.price || 'N/A'}`);
      });
      console.log('');
    }
    
    if (unavailable.length > 0) {
      console.log('❌ Unavailable:\n');
      unavailable.forEach(r => {
        console.log(`  ${r.domain.padEnd(30)} (${r.status})`);
      });
      console.log('');
    }
  }
  
  // Show variations
  if (!flags.noVariations && Object.keys(results.variations).length > 0) {
    console.log('═══════════════════════════════════════════════════════');
    console.log('🎨 NAME VARIATIONS');
    console.log('═══════════════════════════════════════════════════════\n');
    
    for (const [pattern, domains] of Object.entries(results.variations)) {
      if (domains.length === 0) continue;
      
      const patternLabel = pattern.charAt(0).toUpperCase() + pattern.slice(1);
      console.log(`${patternLabel}:\n`);
      
      domains.forEach(r => {
        console.log(`  ✅ ${r.domain.padEnd(30)} ${r.price || 'N/A'}`);
      });
      console.log('');
    }
  }
  
  // Summary
  const totalAvailable = results.exact.filter(r => r.available).length +
                         Object.values(results.variations).flat().length;
  
  console.log('═══════════════════════════════════════════════════════');
  console.log(`📊 SUMMARY: ${totalAvailable} available domains found`);
  console.log('═══════════════════════════════════════════════════════');
}
