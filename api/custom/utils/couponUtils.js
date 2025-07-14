const { logger } = require('~/config');
const { CouponLog } = require('~/custom/models/CouponLog');

/**
 * Deletes coupon logs associated with a given coupon ID.
 * @param {object} Coupon - The Coupon model (mongoose model).
 * @param {object} CouponLog - The CouponLog model (mongoose model).
 * @param {string} couponId - The ID of the coupon whose logs are to be deleted.
 * @returns {Promise<object>} The result from CouponLog.deleteMany operation.
 * @throws {Error} If deletion fails.
 */
async function deleteCouponLogs(couponId, couponCode) {
  try {
    if (!couponId) {
      throw new Error('couponId must be provided to deleteCouponLogs.');
    }

    const result = await CouponLog.deleteMany({ coupon: couponId });
    logger.info(`Deleted ${result.deletedCount} coupon logs for coupon: ${couponCode}`);
    return result;
  } catch (error) {
    logger.error(`Error deleting coupon logs for coupon ${couponCode}:`, error);
    throw error;
  }
}

module.exports = {
  deleteCouponLogs,
};
