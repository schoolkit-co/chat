const { logger } = require('@librechat/data-schemas');
const { getUserMCPAuthMap } = require('@librechat/api');
const { CacheKeys, EModelEndpoint } = require('librechat-data-provider');
const { normalizeEndpointName, isEnabled } = require('~/server/utils');
const loadCustomConfig = require('./loadCustomConfig');
const { getCachedTools } = require('./getCachedTools');
const { findPluginAuthsByKeys } = require('~/models');
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
 * @returns {Promise<TEndpoint | undefined>}
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

async function createGetMCPAuthMap() {
  const customConfig = await getCustomConfig();
  const mcpServers = customConfig?.mcpServers;
  const hasCustomUserVars = Object.values(mcpServers ?? {}).some((server) => server.customUserVars);
  if (!hasCustomUserVars) {
    return;
  }

  /**
   * @param {Object} params
   * @param {GenericTool[]} [params.tools]
   * @param {string} params.userId
   * @returns {Promise<Record<string, Record<string, string>> | undefined>}
   */
  return async function ({ tools, userId }) {
    try {
      if (!tools || tools.length === 0) {
        return;
      }
      const appTools = await getCachedTools({
        userId,
      });
      return await getUserMCPAuthMap({
        tools,
        userId,
        appTools,
        findPluginAuthsByKeys,
      });
    } catch (err) {
      logger.error(
        `[api/server/controllers/agents/client.js #chatCompletion] Error getting custom user vars for agent`,
        err,
      );
    }
  };
}

module.exports = {
  getCustomConfig,
  getBalanceConfig,
  createGetMCPAuthMap,
  getCustomEndpointConfig,
};
