const mongoose = require('mongoose');
const { logger } = require('~/config');

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

module.exports = {
  addSchoolToTransaction,
};