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

/**
 * Manually trigger the auto-refill logic for a given user.
 * Can be used on login or other events where we want to ensure auto-refill happens.
 * 
 * @async
 * @function
 * @param {string} userId - The user ID.
 * @returns {Promise<Object|null>} The result of auto-refill operation or null if not applicable.
 */
const triggerAutoRefill = async (userId) => {
  try {
    // Use lazy loading to avoid circular dependency
    const { Transaction } = require('~/models/Transaction');
    
    // Retrieve the balance record
    const record = await Balance.findOne({ user: userId }).lean();
    if (!record) {
      return null;
    }

    // const refillPermission = await checkRefillPermission(userId);
    // console.log('checkRefillPermission, triggerAutoRefill', refillPermission);
    

    // Check if auto-refill is enabled and has a valid amount
    // if (!record.autoRefillEnabled || record.refillAmount <= 0 || !refillPermission.enable) {
    if (!record.autoRefillEnabled || record.refillAmount <= 0) {
      return null;
    }

    // Check if it's time for auto-refill
    const lastRefillDate = new Date(record.lastRefill);
    const now = new Date();
    
    // ฟังก์ชันตรวจสอบวันที่ไม่ถูกต้อง
    const isInvalidDate = (date) => isNaN(date);
    
    // ฟังก์ชันเพิ่มช่วงเวลาให้กับวันที่
    const addIntervalToDate = (date, value, unit) => {
      const result = new Date(date);
      switch (unit) {
        case 'seconds':
          result.setSeconds(result.getSeconds() + value);
          break;
        case 'minutes':
          result.setMinutes(result.getMinutes() + value);
          break;
        case 'hours':
          result.setHours(result.getHours() + value);
          break;
        case 'days':
          result.setDate(result.getDate() + value);
          break;
        case 'weeks':
          result.setDate(result.getDate() + value * 7);
          break;
        case 'months':
          result.setMonth(result.getMonth() + value);
          break;
        default:
          break;
      }
      return result;
    };
    
    if (
      !isInvalidDate(lastRefillDate) &&
      now < addIntervalToDate(lastRefillDate, record.refillIntervalValue, record.refillIntervalUnit)
    ) {
      return null;
    }

    // Perform auto-refill
    const result = await Transaction.createAutoRefillTransaction({
      user: userId,
      tokenType: 'credits',
      context: 'autoRefill',
      rawAmount: record.refillAmount,
    });

    return result;
  } catch (error) {
    logger.error('[triggerAutoRefill] Failed to perform auto-refill', error);
    return null;
  }
};

const checkUsagePermissionCtrl = async (userId) => {

  const permission = await checkUsagePermission(userId);
};



module.exports = {
  addSchoolToTransaction,
  initializeUserBalance,
  triggerAutoRefill,
  checkUsagePermissionCtrl,
};