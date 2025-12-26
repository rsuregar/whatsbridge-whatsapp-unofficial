/**
 * API Key Authentication Middleware
 * 
 * Validates X-Api-Key header against:
 * 1. API_KEY environment variable
 * 2. Custom API keys stored in data/api-keys.json
 * 
 * If neither is configured, authentication is skipped (open access).
 */

import { Request, Response, NextFunction } from 'express';
import { isValidApiKey } from '../services/apiKey/ApiKeyService';

const apiKeyAuth = (req: Request, res: Response, next: NextFunction): void => {
    const envApiKey = process.env.API_KEY;
    const hasEnvKey = envApiKey && envApiKey !== '' && envApiKey !== 'your_api_key_here';
    
    // If no API key is configured anywhere, skip authentication
    if (!hasEnvKey) {
        // Check if there are any custom API keys
        try {
            const { listApiKeys } = require('../services/apiKey/ApiKeyService');
            const keysList = listApiKeys();
            if (!keysList.success || keysList.data.length === 0) {
                // No API keys configured at all, allow open access
                return next();
            }
        } catch (error) {
            // If service fails, allow open access
            return next();
        }
    }
    
    const providedKey = req.headers['x-api-key'] as string | undefined;
    
    if (!providedKey) {
        res.status(401).json({
            success: false,
            message: 'Missing X-Api-Key header'
        });
        return;
    }
    
    // Validate against both env var and custom keys
    if (!isValidApiKey(providedKey)) {
        res.status(403).json({
            success: false,
            message: 'Invalid API key'
        });
        return;
    }
    
    next();
};

export default apiKeyAuth;
