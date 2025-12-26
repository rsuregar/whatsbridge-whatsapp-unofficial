/**
 * API Key Service
 * Manages custom API keys stored in a JSON file
 */

import fs from 'fs';
import path from 'path';

interface ApiKeyEntry {
  key: string;
  createdAt: string;
  lastUsed?: string;
}

const API_KEYS_FILE = path.join(process.cwd(), 'data', 'api-keys.json');

// Ensure data directory exists
function ensureDataDir(): void {
  const dataDir = path.dirname(API_KEYS_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Load API keys from file
function loadApiKeys(): ApiKeyEntry[] {
  try {
    ensureDataDir();
    if (!fs.existsSync(API_KEYS_FILE)) {
      return [];
    }
    const data = fs.readFileSync(API_KEYS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading API keys:', error);
    return [];
  }
}

// Save API keys to file
function saveApiKeys(keys: ApiKeyEntry[]): void {
  try {
    ensureDataDir();
    fs.writeFileSync(API_KEYS_FILE, JSON.stringify(keys, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving API keys:', error);
  }
}

// Check if an API key is valid
export function isValidApiKey(apiKey: string): boolean {
  // Check environment variable first
  const envApiKey = process.env.API_KEY;
  if (envApiKey && envApiKey !== '' && envApiKey !== 'your_api_key_here') {
    if (apiKey === envApiKey) {
      return true;
    }
  }

  // Check custom API keys
  const keys = loadApiKeys();
  const found = keys.find((entry) => entry.key === apiKey);
  
  if (found) {
    // Update last used timestamp
    found.lastUsed = new Date().toISOString();
    saveApiKeys(keys);
    return true;
  }

  return false;
}

// Add a new API key
export function addApiKey(apiKey: string): { success: boolean; message: string } {
  try {
    const keys = loadApiKeys();
    
    // Check if key already exists
    if (keys.some((entry) => entry.key === apiKey)) {
      return {
        success: false,
        message: 'API key already exists',
      };
    }

    // Add new key
    keys.push({
      key: apiKey,
      createdAt: new Date().toISOString(),
    });

    saveApiKeys(keys);
    return {
      success: true,
      message: 'API key added successfully',
    };
  } catch (error: any) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to add API key',
    };
  }
}

// Remove an API key
export function removeApiKey(apiKey: string): { success: boolean; message: string } {
  try {
    const keys = loadApiKeys();
    const filtered = keys.filter((entry) => entry.key !== apiKey);
    
    if (filtered.length === keys.length) {
      return {
        success: false,
        message: 'API key not found',
      };
    }

    saveApiKeys(filtered);
    return {
      success: true,
      message: 'API key removed successfully',
    };
  } catch (error: any) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to remove API key',
    };
  }
}

// List all API keys (without exposing the full keys)
export function listApiKeys(): { success: boolean; data: Array<{ prefix: string; createdAt: string; lastUsed?: string }> } {
  try {
    const keys = loadApiKeys();
    return {
      success: true,
      data: keys.map((entry) => ({
        prefix: entry.key.substring(0, 8) + '...',
        createdAt: entry.createdAt,
        lastUsed: entry.lastUsed,
      })),
    };
  } catch (error: any) {
    return {
      success: false,
      data: [],
    };
  }
}

