const mongoose = require('mongoose');
const { logger } = require('~/config');
const Balance = mongoose.models.Balance;
const { checkRefillPermission, checkUsagePermission } = require('../models/balanceUtil');

/**
 * Add school information to transaction data if the user has a school
 * @param {Object} txData - Transaction data.
 */
const addSchoolToTransaction = async (txData) => {
  // If txData has a user object reference, try to get the school
  if (txData.user && typeof txData.user === 'object' && txData.user.school) {
    txData.school = txData.user.school;
  } else if (txData.user && typeof txData.user !== 'object') {
    // If txData.user is just an ID, try to fetch the user to get school info
    try {
      const User = mongoose.model('User');
      const userDoc = await User.findById(txData.user).lean();
      if (userDoc && userDoc.school) {
        txData.school = userDoc.school;
      }
    } catch (error) {
      logger.error('[addSchoolToTransaction] Error fetching user school:', error);
    }
  }
  return txData;
};

/**
 * Initialize user balance if it doesn't exist
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User balance object or null
 */
const initializeUserBalance = async (userId) => {
  try {
    let userBalance = await Balance.findOne({ user: userId }).lean();
    
    // If no balance record exists but balance system is enabled, initialize it similar to createUser
    if (!userBalance) {
      // Use lazy loading to avoid circular dependency
      let balance = null;
      try {
        const { getBalanceConfig } = require('~/server/services/Config');
        balance = await getBalanceConfig(userId);
      } catch (error) {
        logger.warn('Could not load balance config due to circular dependency:', error.message);
        return null;
      }
      
      // Create new balance record if enabled and startBalance is defined
      if (balance?.enabled && balance?.startBalance) {
        const update = {
          $inc: { tokenCredits: balance.startBalance },
        };

        if (
          balance.autoRefillEnabled &&
          balance.refillIntervalValue != null &&
          balance.refillIntervalUnit != null &&
          balance.refillAmount != null
        ) {
          update.$set = {
            autoRefillEnabled: true,
            refillIntervalValue: balance.refillIntervalValue,
            refillIntervalUnit: balance.refillIntervalUnit,
            refillAmount: balance.refillAmount,
          };
        }

        userBalance = await Balance.findOneAndUpdate(
          { user: userId }, 
          update, 
          { upsert: true, new: true }
        ).lean();
      }
    }
    
    return userBalance;
  } catch (error) {
    logger.error('[initializeUserBalance] Error initializing user balance:', error);
    return null;
  }
};

module.exports = {
  addSchoolToTransaction,
  initializeUserBalance,
};