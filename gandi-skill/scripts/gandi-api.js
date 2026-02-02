#!/usr/bin/env node

/**
 * Gandi API Client
 * Core functions for interacting with Gandi's v5 API
 */

import https from 'https';
import fs from 'fs';
import path from 'path';

// Configuration
const CONFIG_DIR = path.join(process.env.HOME, '.config', 'gandi');
const TOKEN_FILE = path.join(CONFIG_DIR, 'api_token');
const URL_FILE = path.join(CONFIG_DIR, 'api_url');
const DEFAULT_API_URL = 'https://api.gandi.net';

/**
 * Read API token from config
 */
export function readToken() {
  try {
    if (!fs.existsSync(TOKEN_FILE)) {
      throw new Error(`Token file not found at ${TOKEN_FILE}\nCreate it with: echo "YOUR_PAT" > ${TOKEN_FILE} && chmod 600 ${TOKEN_FILE}`);
    }
    
    const token = fs.readFileSync(TOKEN_FILE, 'utf8').trim();
    
    if (!token) {
      throw new Error('Token file is empty');
    }
    
    return token;
  } catch (error) {
    if (error.code === 'EACCES') {
      throw new Error(`Cannot read token file. Check permissions: chmod 600 ${TOKEN_FILE}`);
    }
    throw error;
  }
}

/**
 * Read API URL from config (or use default)
 */
export function readApiUrl() {
  try {
    if (fs.existsSync(URL_FILE)) {
      const url = fs.readFileSync(URL_FILE, 'utf8').trim();
      if (url) return url;
    }
  } catch (error) {
    // Ignore errors, use default
  }
  
  return DEFAULT_API_URL;
}

/**
 * Read domain checker configuration
 * Checks Gateway config first, then falls back to defaults
 * @returns {Object} Domain checker config
 */
export function readDomainCheckerConfig() {
  const defaultConfigPath = path.join(path.dirname(new URL(import.meta.url).pathname), '../config/domain-checker-defaults.json');
  
  try {
    // TODO: Read from Gateway config when available
    // const gatewayConfig = readGatewayConfig();
    // const config = gatewayConfig.skills?.entries?.gandi?.config?.domainChecker;
    // if (config) return config;
    
    // Fallback to defaults
    if (fs.existsSync(defaultConfigPath)) {
      return JSON.parse(fs.readFileSync(defaultConfigPath, 'utf8'));
    }
  } catch (error) {
    console.warn('Could not read domain checker config, using hardcoded defaults:', error.message);
  }
  
  // Hardcoded fallback
  return {
    tlds: {
      mode: 'extend',
      defaults: ['com', 'net', 'org', 'info', 'io', 'dev', 'app', 'ai', 'tech'],
      custom: []
    },
    variations: {
      enabled: true,
      patterns: ['hyphenated', 'abbreviated', 'prefix', 'suffix', 'numbers'],
      prefixes: ['get', 'my', 'the', 'try'],
      suffixes: ['app', 'hub', 'io', 'ly', 'ai', 'hq'],
      maxNumbers: 3
    },
    rateLimit: {
      maxConcurrent: 10,
      delayMs: 100
    }
  };
}

/**
 * Make API request
 * @param {string} endpoint - API endpoint (e.g., '/v5/domain/domains')
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE, PATCH)
 * @param {object} data - Request body (for POST/PUT/PATCH)
 * @param {object} queryParams - Query string parameters
 * @returns {Promise<object>} Response data
 */
export function gandiApi(endpoint, method = 'GET', data = null, queryParams = {}) {
  return new Promise((resolve, reject) => {
    const token = readToken();
    const apiUrl = readApiUrl();
    
    // Build URL with query parameters
    const url = new URL(endpoint, apiUrl);
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value);
      }
    });
    
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    };
    
    // Add Content-Type for requests with body
    if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
      options.headers['Content-Type'] = 'application/json';
    }
    
    const req = https.request(url, options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        // Handle different status codes
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const parsed = responseData ? JSON.parse(responseData) : {};
            resolve({
              statusCode: res.statusCode,
              data: parsed,
              headers: res.headers
            });
          } catch (error) {
            // Some responses are plain text
            resolve({
              statusCode: res.statusCode,
              data: responseData,
              headers: res.headers
            });
          }
        } else {
          // Parse error response
          let errorData;
          try {
            errorData = JSON.parse(responseData);
          } catch (e) {
            errorData = { message: responseData };
          }
          
          const error = new Error(
            errorData.message || `HTTP ${res.statusCode}: ${res.statusMessage}`
          );
          error.statusCode = res.statusCode;
          error.response = errorData;
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    // Send request body if present
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

/**
 * Test authentication
 */
export async function testAuth() {
  try {
    const result = await gandiApi('/v5/organization/organizations');
    return {
      success: true,
      organizations: result.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      statusCode: error.statusCode
    };
  }
}

/**
 * List domains
 * @param {object} options - Query options (page, per_page, sort_by, sharing_id)
 */
export async function listDomains(options = {}) {
  const result = await gandiApi('/v5/domain/domains', 'GET', null, options);
  return result.data;
}

/**
 * Get domain details
 * @param {string} domain - Domain name (FQDN)
 */
export async function getDomain(domain) {
  const result = await gandiApi(`/v5/domain/domains/${domain}`);
  return result.data;
}

/**
 * List DNS records for a domain
 * @param {string} domain - Domain name (FQDN)
 */
export async function listDnsRecords(domain) {
  const result = await gandiApi(`/v5/livedns/domains/${domain}/records`);
  return result.data;
}

/**
 * Get specific DNS records
 * @param {string} domain - Domain name
 * @param {string} name - Record name (e.g., '@', 'www')
 * @param {string} type - Record type (e.g., 'A', 'CNAME')
 */
export async function getDnsRecord(domain, name, type) {
  const result = await gandiApi(`/v5/livedns/domains/${domain}/records/${name}/${type}`);
  return result.data;
}

/**
 * Check domain availability
 * @param {string[]} domains - Array of domain names to check
 */
/**
 * Check availability of one or more domains
 * @param {string[]} domains - Array of domain names to check
 * @returns {Promise<Object>} Availability results for each domain
 */
export async function checkAvailability(domains) {
  if (!Array.isArray(domains)) {
    domains = [domains];
  }
  
  // Build query params with multiple 'name' parameters
  const queryString = domains.map(d => `name=${encodeURIComponent(d)}`).join('&');
  const result = await gandiApi(`/v5/domain/check?${queryString}`, 'GET');
  
  return result.data;
}

/**
 * Generate domain name variations
 * @param {string} baseName - Base domain name (without TLD)
 * @param {Object} config - Variation config
 * @returns {Object} Generated variations grouped by pattern
 */
export function generateVariations(baseName, config = {}) {
  const variations = {
    hyphenated: [],
    abbreviated: [],
    prefix: [],
    suffix: [],
    numbers: []
  };
  
  const patterns = config.patterns || ['hyphenated', 'abbreviated', 'prefix', 'suffix', 'numbers'];
  const prefixes = config.prefixes || ['get', 'my', 'the', 'try'];
  const suffixes = config.suffixes || ['app', 'hub', 'io', 'ly', 'ai', 'hq'];
  const maxNumbers = config.maxNumbers || 3;
  
  // Hyphenated (insert hyphens between likely word boundaries)
  if (patterns.includes('hyphenated')) {
    // Simple strategy: add hyphen before capitals and after common prefixes
    const hyphenated = baseName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    if (hyphenated !== baseName && !hyphenated.includes('--')) {
      variations.hyphenated.push(hyphenated);
    }
    
    // Try splitting at vowel boundaries
    const parts = baseName.match(/[bcdfghjklmnpqrstvwxyz]+[aeiou]+/gi);
    if (parts && parts.length > 1) {
      variations.hyphenated.push(parts.join('-').toLowerCase());
    }
  }
  
  // Abbreviated (remove vowels, keep consonants)
  if (patterns.includes('abbreviated')) {
    const abbreviated = baseName.replace(/[aeiou]/gi, '').toLowerCase();
    if (abbreviated.length >= 3 && abbreviated !== baseName) {
      variations.abbreviated.push(abbreviated);
    }
  }
  
  // Prefix variations
  if (patterns.includes('prefix')) {
    prefixes.forEach(prefix => {
      variations.prefix.push(`${prefix}-${baseName}`);
      variations.prefix.push(`${prefix}${baseName}`);
    });
  }
  
  // Suffix variations
  if (patterns.includes('suffix')) {
    suffixes.forEach(suffix => {
      variations.suffix.push(`${baseName}-${suffix}`);
      variations.suffix.push(`${baseName}${suffix}`);
    });
  }
  
  // Number variations
  if (patterns.includes('numbers')) {
    for (let i = 2; i <= maxNumbers + 1; i++) {
      variations.numbers.push(`${baseName}${i}`);
    }
  }
  
  return variations;
}

// If run directly, show usage
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Gandi API Client');
  console.log('');
  console.log('This module provides functions for interacting with Gandi API.');
  console.log('Import it in your scripts:');
  console.log('');
  console.log('  import { gandiApi, listDomains, listDnsRecords } from "./gandi-api.js";');
  console.log('');
  console.log('Available functions:');
  console.log('  - readToken()');
  console.log('  - readApiUrl()');
  console.log('  - readDomainCheckerConfig()');
  console.log('  - gandiApi(endpoint, method, data, queryParams)');
  console.log('  - testAuth()');
  console.log('  - listDomains(options)');
  console.log('  - getDomain(domain)');
  console.log('  - listDnsRecords(domain)');
  console.log('  - getDnsRecord(domain, name, type)');
  console.log('  - checkAvailability(domains)');
  console.log('  - generateVariations(baseName, config)');
  console.log('');
  console.log('Configuration:');
  console.log(`  Token: ${TOKEN_FILE}`);
  console.log(`  API URL: ${URL_FILE} (optional)`);
}
