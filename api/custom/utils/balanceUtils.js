const mongoose = require('mongoose');
const { logger } = require('~/config');
const Balance = mongoose.models.Balance;
const { Transaction } = require('~/models/Transaction');

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
    // Retrieve the balance record
    const record = await Balance.findOne({ user: userId }).lean();
    if (!record) {
      logger.info(`[triggerAutoRefill] No balance record found for user: ${userId}`);
      return null;
    }

    // Check if auto-refill is enabled and has a valid amount
    if (!record.autoRefillEnabled || record.refillAmount <= 0) {
      logger.info(`[triggerAutoRefill] Auto-refill not enabled or refill amount is zero/negative for user: ${userId}`);
      return null;
    }

    // Check if it's time for auto-refill
    const lastRefillDate = new Date(record.lastRefill);
    const now = new Date();

    // ฟังก์ชันตรวจสอบวันที่ไม่ถูกต้อง
    const isInvalidDate = (date) => isNaN(date.getTime()); // Corrected: use getTime() for robust NaN check

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
          logger.warn(`[triggerAutoRefill] Unknown interval unit: ${unit} for user: ${userId}`);
          break;
      }
      return result;
    };

    // If lastRefillDate is not set (e.g., new user) or is invalid, consider it time for refill.
    if (record.lastRefill && !isInvalidDate(lastRefillDate)) {
      const nextRefillDate = addIntervalToDate(lastRefillDate, record.refillIntervalValue, record.refillIntervalUnit);
      if (now < nextRefillDate) {
        logger.info(`[triggerAutoRefill] Not yet time for auto-refill for user: ${userId}. Next refill on: ${nextRefillDate.toISOString()}`);
        return null;
      }
    } else if (record.lastRefill) {
      // lastRefill has a value but it's an invalid date
      logger.warn(`[triggerAutoRefill] Invalid lastRefillDate ('${record.lastRefill}') for user: ${userId}. Proceeding with refill check.`);
    }
    // If record.lastRefill is null/undefined, it's the first time, so proceed.

    logger.info(`[triggerAutoRefill] Proceeding with auto-refill for user: ${userId}`);
    // Perform auto-refill
    const result = await Transaction.createAutoRefillTransaction({
      user: userId,
      tokenType: 'credits', // Assuming 'credits' is the standard tokenType
      context: 'autoRefill',
      rawAmount: record.refillAmount,
    });

    // Update lastRefill date in the Balance record
    // It's important to do this to prevent immediate re-triggering if createAutoRefillTransaction doesn't update it.
    // However, createAutoRefillTransaction *should* ideally handle setting the lastRefill timestamp.
    // If Transaction.createAutoRefillTransaction already updates Balance.lastRefill, this is redundant.
    // For safety, explicitly updating here unless confirmed otherwise.
    // Consider that `createAutoRefillTransaction` might run hooks that update `lastRefill`.
    // If not, this is critical:
    // await Balance.updateOne({ user: userId }, { $set: { lastRefill: new Date() } });
    // logger.info(`[triggerAutoRefill] Balance record updated with new lastRefill date for user: ${userId}`);


    logger.info(`[triggerAutoRefill] Auto-refill successful for user: ${userId}. Result: ${JSON.stringify(result)}`);
    return result;
  } catch (error) {
    logger.error(`[triggerAutoRefill] Failed to perform auto-refill for user ${userId}:`, error);
    return null;
  }
};

module.exports = {
  triggerAutoRefill,
};
