const { CacheKeys, EModelEndpoint } = require('librechat-data-provider');
const { normalizeEndpointName, isEnabled } = require('~/server/utils');
const loadCustomConfig = require('./loadCustomConfig');
const getLogStores = require('~/cache/getLogStores');

/**
 * Retrieves the configuration object
 * @function getCustomConfig
 * @returns {Promise<TCustomConfig | null>}
 * */
async function getCustomConfig() {
  const cache = getLogStores(CacheKeys.CONFIG_STORE);
  return (await cache.get(CacheKeys.CUSTOM_CONFIG)) || (await loadCustomConfig());
}

/**
 * Retrieves the configuration object
 * @function getBalanceConfig
 * @returns {Promise<TCustomConfig['balance'] | null>}
 * */
async function getBalanceConfig(userId) {
  const isLegacyEnabled = isEnabled(process.env.CHECK_BALANCE);
  const startBalance = process.env.START_BALANCE;
  /** @type {TCustomConfig['balance']} */
  const config = {
    enabled: isLegacyEnabled,
    startBalance: startBalance != null && startBalance ? parseInt(startBalance, 10) : undefined,
    autoRefillEnabled: isEnabled(process.env.AUTO_REFILL_ENABLED),
    refillIntervalValue: parseInt(process.env.REFILL_INTERVAL_VALUE, 10),
    refillIntervalUnit: process.env.REFILL_INTERVAL_UNIT,
    refillAmount: parseInt(process.env.REFILL_AMOUNT, 10),
  };
  let schoolKitConfig = {};
  if (userId) {
    // Use lazy loading to avoid circular dependency
    try {
      const { getSchoolKitBalanceConfig } = require('~/custom/models/balanceUtil');
      schoolKitConfig = await getSchoolKitBalanceConfig(userId);
    } catch (error) {
      // Handle circular dependency gracefully
      console.warn('Could not load school kit balance config due to circular dependency:', error.message);
    }
  }
  const customConfig = await getCustomConfig();
  if (!customConfig) {
    return { ...config, ...schoolKitConfig };
    return config;
  }
  return { ...config, ...(customConfig?.['balance'] ?? {}), ...schoolKitConfig };
  return { ...config, ...(customConfig?.['balance'] ?? {}) };
}

/**
 *
 * @param {string | EModelEndpoint} endpoint
 */
const getCustomEndpointConfig = async (endpoint) => {
  const customConfig = await getCustomConfig();
  if (!customConfig) {
    throw new Error(`Config not found for the ${endpoint} custom endpoint.`);
  }

  const { endpoints = {} } = customConfig;
  const customEndpoints = endpoints[EModelEndpoint.custom] ?? [];
  return customEndpoints.find(
    (endpointConfig) => normalizeEndpointName(endpointConfig.name) === endpoint,
  );
};

module.exports = { getCustomConfig, getBalanceConfig, getCustomEndpointConfig };
