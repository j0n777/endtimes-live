// .env.local Persistence Utility
// Saves admin panel configurations to .env.local file on server

import { AdminConfig } from '../types';

/**
 * Save admin config to .env.local file
 * This should be called from a server-side API route
 * Client-side code cannot directly write to .env.local
 */
export async function saveConfigToEnv(config: AdminConfig): Promise<boolean> {
    try {
        // Call server API to save .env
        const response = await fetch('/api/save-env', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config)
        });

        return response.ok;
    } catch (error) {
        console.error('Failed to save config to .env:', error);
        return false;
    }
}

/**
 * Format admin config as .env file content
 */
export function formatEnvContent(config: AdminConfig): string {
    let env = '# End Times Monitor - Configuration\n';
    env += '# Auto-generated from Admin Panel\n\n';

    if (config.nasaEonetApiKey) {
        env += `NASA_EONET_API_KEY=${config.nasaEonetApiKey}\n`;
    }

    if (config.nasaFirmsApiKey) {
        env += `NASA_FIRMS_API_KEY=${config.nasaFirmsApiKey}\n`;
    }

    if (config.acledApiKey) {
        env += `ACLED_API_KEY=${config.acledApiKey}\n`;
    }

    if (config.acledEmail) {
        env += `ACLED_EMAIL=${config.acledEmail}\n`;
    }

    if (config.telegramBotToken) {
        env += `TELEGRAM_BOT_TOKEN=${config.telegramBotToken}\n`;
    }

    if (config.telegramChannelIds && config.telegramChannelIds.length > 0) {
        env += `TELEGRAM_CHANNEL_IDS=${config.telegramChannelIds.join(',')}\n`;
    }

    if (config.gdacsEnabled !== undefined) {
        env += `GDACS_ENABLED=${config.gdacsEnabled}\n`;
    }

    if (config.whoEnabled !== undefined) {
        env += `WHO_ENABLED=${config.whoEnabled}\n`;
    }

    if (config.gdeltEnabled !== undefined) {
        env += `GDELT_ENABLED=${config.gdeltEnabled}\n`;
    }

    if (config.polymarketEnabled !== undefined) {
        env += `POLYMARKET_ENABLED=${config.polymarketEnabled}\n`;
    }

    if (config.poisEnabled !== undefined) {
        env += `POIS_ENABLED=${config.poisEnabled}\n`;
    }

    return env;
}

/**
 * Load config from .env.local
 * This runs on server-side during app initialization
 */
export function loadConfigFromEnv(): Partial<AdminConfig> {
    if (typeof window !== 'undefined') {
        // Client-side: configurations are loaded via localStorage
        return {};
    }

    // Server-side: load from process.env
    return {
        nasaEonetApiKey: process.env.NASA_EONET_API_KEY,
        nasaFirmsApiKey: process.env.NASA_FIRMS_API_KEY,
        acledApiKey: process.env.ACLED_API_KEY,
        acledEmail: process.env.ACLED_EMAIL,
        telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
        telegramChannelIds: process.env.TELEGRAM_CHANNEL_IDS?.split(',') || [],
        gdacsEnabled: process.env.GDACS_ENABLED === 'true',
        whoEnabled: process.env.WHO_ENABLED === 'true',
        gdeltEnabled: process.env.GDELT_ENABLED === 'true',
        polymarketEnabled: process.env.POLYMARKET_ENABLED === 'true',
        poisEnabled: process.env.POIS_ENABLED !== 'false', // Default true
    };
}
