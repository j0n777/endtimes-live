// Server-side script to save configuration to .env.local
// Usage: node save-env-config.js
// Called from client via simple HTTP server or manually

const fs = require('fs');
const path = require('path');

// Path to .env.local
const ENV_FILE = path.join(__dirname, '..', '.env.local');

/**
 * Save configuration to .env.local
 * @param {Object} config - Configuration object
 */
function saveEnvConfig(config) {
    let envContent = '# End Times Monitor - Configuration\n';
    envContent += `# Last updated: ${new Date().toISOString()}\n\n`;

    // API Keys
    if (config.nasaEonetApiKey) {
        envContent += `NASA_EONET_API_KEY=${config.nasaEonetApiKey}\n`;
    }

    if (config.nasaFirmsApiKey) {
        envContent += `NASA_FIRMS_API_KEY=${config.nasaFirmsApiKey}\n`;
    }

    if (config.acledApiKey) {
        envContent += `ACLED_API_KEY=${config.acledApiKey}\n`;
    }

    if (config.acledEmail) {
        envContent += `ACLED_EMAIL=${config.acledEmail}\n`;
    }

    if (config.telegramBotToken) {
        envContent += `TELEGRAM_BOT_TOKEN=${config.telegramBotToken}\n`;
    }

    if (config.telegramChannelIds && config.telegramChannelIds.length > 0) {
        envContent += `TELEGRAM_CHANNEL_IDS=${config.telegramChannelIds.join(',')}\n`;
    }

    // Feature toggles
    envContent += `\n# Feature Toggles\n`;
    envContent += `GDACS_ENABLED=${config.gdacsEnabled !== false}\n`;
    envContent += `WHO_ENABLED=${config.whoEnabled !== false}\n`;
    envContent += `GDELT_ENABLED=${config.gdeltEnabled !== false}\n`;
    envContent += `POLYMARKET_ENABLED=${config.polymarketEnabled !== false}\n`;
    envContent += `POIS_ENABLED=${config.poisEnabled !== false}\n`;

    // Write to file
    fs.writeFileSync(ENV_FILE, envContent, 'utf8');
    console.log('✅ Configuration saved to .env.local');
    console.log(`📁 File: ${ENV_FILE}`);
}

/**
 * Load configuration from localStorage export
 * In production, this would receive data from admin panel
 */
function loadConfigFromLocalStorage() {
    // For now, read from a temporary JSON file
    // In production, admin panel would call this via HTTP
    const configPath = path.join(__dirname, 'admin-config.json');

    if (fs.existsSync(configPath)) {
        const configData = fs.readFileSync(configPath, 'utf8');
        return JSON.parse(configData);
    }

    return {};
}

// Main execution
if (require.main === module) {
    console.log('🔧 Loading configuration...');
    const config = loadConfigFromLocalStorage();
    saveEnvConfig(config);
}

module.exports = { saveEnvConfig };
