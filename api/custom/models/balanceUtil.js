const mongoose = require('mongoose');
const { SystemRoles } = require('librechat-data-provider');
const School = require('./schema/school');
const logger = require('~/config/winston');
const Balance = mongoose.models.Balance;
const User = mongoose.models.User;
const { Transaction } = require('~/models/Transaction');
const { calcBillPeriod } = require('./SchoolPremium');
const { Keyv } = require('keyv');
const keyvRedis = require('~/cache/keyvRedis');
const { isEnabled } = require('~/server/utils');

const schoolBillCache = isEnabled(process.env.USE_REDIS) && keyvRedis
  ? new Keyv({ store: keyvRedis })
  : null;

const checkRefillPermission = async (userId) => {
  try {
    const userInfo = await User.findOne({ _id: userId }).lean();
    if (!userInfo) {
      return {
        enable: false,
        error: 'no userId',
      };
    }
    if (userInfo.role === SystemRoles.ADMIN || userInfo.superCredit) {
      return {
        enable: true,
      };
    }
    let demoTrialDays = parseInt(process.env.TRIAL_DAYS, 10) || 14;
    let demoEnabled = isEnabled(process.env.DEMO_ENABLED) || true;
    let expiredDate;
    const now = new Date();
    calcExpiredDate: {
      const demoExpiredDate = new Date(userInfo.createdAt);
      demoExpiredDate.setDate(demoExpiredDate.getDate() + demoTrialDays + 1);
      demoExpiredDate.setHours(0, 0, 0, 0);
      demoExpiredDate.setHours(demoExpiredDate.getHours() - 7);
      if (userInfo.school) {
        const schoolInfo = await School.findOne({ school: userInfo.school }).lean();
        if (schoolInfo?.expiredDate) {
          const schoolExpiredDate = new Date(schoolInfo.expiredDate);
          expiredDate = demoEnabled ? new Date(Math.max(demoExpiredDate, schoolExpiredDate)) : schoolExpiredDate;
        } else {
          expiredDate = demoEnabled ? demoExpiredDate : now;
        }
      } else {
        expiredDate = demoEnabled ? demoExpiredDate : now;
      }
      // balanceExpiredDate is from coupon
      const balanceInfo = await Balance.findOne({ user: userId }).lean();
      if (balanceInfo?.expiredDate) {
        const balanceExpiredDate = new Date(balanceInfo.expiredDate);
        expiredDate = balanceExpiredDate > expiredDate ? balanceExpiredDate : expiredDate;
      }
    }
    if (now > expiredDate) {
      return {
        enable: false,
        expiredDate,
      };
    }
    return {
      enable: true,
      expiredDate,
    };
  } catch (error) {
    logger.error(`Error in checkRefillPermission [UserId: ${userId}]: `, error);
    return {
      enable: false,
      error,
    };
  }
};

const checkUsagePermission = checkRefillPermission;

const getSchoolKitBalanceConfig = async (userId) => {
  try {
    const user = await User.findById(userId).lean();

    if (user?.superCredit) {
      return {
        startBalance: 900000000,
        refillIntervalValue: 1,
        refillIntervalUnit: 'days',
        refillAmount: 900000000,
      };
    }

    if (!user || !user.school) {
      return {};
    }

    const school = await School.findOne({ school: user.school }).lean();
    if (!school) {
      return {};
    }

    const now = new Date();
    const schoolPremiumExpiredDate = new Date(school.expiredDate);
    if (now > schoolPremiumExpiredDate) {
      return {};
    }

    return {
      startBalance: parseInt(process.env.SCHOOL_START_BALANCE, 10),
      refillIntervalValue: parseInt(process.env.SCHOOL_REFILL_INTERVAL_VALUE, 10),
      refillIntervalUnit: process.env.SCHOOL_REFILL_INTERVAL_UNIT,
      refillAmount: parseInt(process.env.SCHOOL_REFILL_AMOUNT, 10),
    };
  } catch (error) {
    logger.error(`Error in getSchoolKitBalanceConfig [UserId: ${userId}]: `, error);
    return {};
  }
}

/**
 * คำนวณผลรวม tokenValue ของ transactions ในโรงเรียนสำหรับรอบบิลปัจจุบัน
 * @param {Number} schoolId - รหัสโรงเรียน
 * @returns {Promise<Object>} ผลรวม tokenValue และข้อมูลรอบบิล
 */
const getSchoolCurrentBillToken = async (schoolId) => {
  try {
    // ตรวจสอบว่าเป็น ID โรงเรียนที่ถูกต้องหรือไม่
    if (!schoolId || isNaN(parseInt(schoolId))) {
      throw new Error('Invalid schoolId provided');
    }

    // สร้าง cache key
    const cacheKey = `school_bill_token:${schoolId}`;
    
    // ตรวจสอบ cache ก่อน
    if (schoolBillCache) {
      try {
        const cachedResult = await schoolBillCache.get(cacheKey);
        if (cachedResult) {
          // logger.debug(`[getSchoolCurrentBillToken] Cache hit for schoolId ${schoolId}`);
          return JSON.parse(cachedResult);
        }
      } catch (cacheError) {
        logger.warn(`[getSchoolCurrentBillToken] Cache read error for schoolId ${schoolId}: ${cacheError.message}`);
      }
    }

    // คำนวณรอบบิลปัจจุบัน
    const billPeriod = await calcBillPeriod(schoolId);
    const { periodStart, periodEnd } = billPeriod;

    // ค้นหา transactions ของโรงเรียนในรอบบิลปัจจุบัน
    const transactions = await Transaction.find({
      school: schoolId,
      createdAt: {
        $gte: periodStart,
        $lt: periodEnd
      }
    }).lean();

    // คำนวณผลรวมแยกตาม tokenType (credits, prompt, completion)
    const tokenSummary = transactions.reduce((summary, transaction) => {
      const tokenType = transaction.tokenType || 'unknown';
      if (!summary[tokenType]) {
        summary[tokenType] = {
          count: 0,
          totalValue: 0
        };
      }
      summary[tokenType].count += 1;
      summary[tokenType].totalValue += (transaction.tokenValue || 0);
      return summary;
    }, {});

    // คำนวณผลรวม tokenValue เฉพาะ 'prompt' และ 'completion' tokenType จาก tokenSummary
    const totalTokenValue = (tokenSummary.prompt?.totalValue || 0) + (tokenSummary.completion?.totalValue || 0);

    const result = {
      schoolId,
      periodStart,
      periodEnd,
      totalTokenValue,
      transactionCount: transactions.length,
    };

    // บันทึกลง cache พร้อมกำหนดเวลาหมดอายุ
    if (schoolBillCache) {
      try {
        // คำนวณ TTL จนถึง periodEnd
        const now = new Date();
        const ttl = Math.max(0, periodEnd.getTime() - now.getTime());
        
        if (ttl > 0) {
          await schoolBillCache.set(cacheKey, JSON.stringify(result), ttl);
          logger.debug(`[getSchoolCurrentBillToken] Cached result for schoolId ${schoolId}, TTL: ${ttl}ms`);
        }
      } catch (cacheError) {
        logger.warn(`[getSchoolCurrentBillToken] Cache write error for schoolId ${schoolId}: ${cacheError.message}`);
      }
    }

    return result;

  } catch (error) {
    logger.error(`[getSchoolCurrentBillToken] Error for schoolId ${schoolId}: ${error.message}`);
    throw error;
  }
};

/**
 * ตรวจสอบและคำนวณ school premium monthly credits สำหรับผู้ใช้
 * @param {string} userId - รหัสผู้ใช้
 * @param {number} personalBalance - ยอดเงินส่วนตัวของผู้ใช้
 * @returns {Promise<number>} ยอดเงินของโรงเรียนหรือยอดเงินส่วนตัวหากไม่มีข้อมูลโรงเรียน
 */
const checkSchoolPremiumMonthlyCredits = async (userId, personalBalance) => {
  try {
    // ค้นหาข้อมูลผู้ใช้โดยใช้ _id เพื่อหา school
    const user = await User.findOne({ _id: userId }).lean();
    if (!user || !user.school) {
      return personalBalance;
    }

    // ค้นหาข้อมูลโรงเรียนโดยใช้ school field เพื่อหา monthlyCredits
    const school = await School.findOne({ school: user.school }).lean();
    if (!school || !school.monthlyCredits) {
      return personalBalance;
    }

    // ใช้ school field เรียกใช้ getSchoolCurrentBillToken เพื่อหา totalTokenValue
    const billTokenData = await getSchoolCurrentBillToken(user.school);
    if (!billTokenData || typeof billTokenData.totalTokenValue !== 'number') {
      return personalBalance;
    }

    // คำนวณ schoolBalance = monthlyCredits + totalTokenValue
    const schoolBalance = school.monthlyCredits + billTokenData.totalTokenValue;
    
    return schoolBalance;
  } catch (error) {
    logger.error(`Error in checkSchoolPremiumMonthlyCredits [UserId: ${userId}]: `, error);
    return personalBalance;
  }
};

/**
 * ลบ cache ของ school_bill_token สำหรับโรงเรียนที่ระบุ
 * @param {Number} schoolId - รหัสโรงเรียน
 * @returns {Promise<boolean>} true หากลบสำเร็จ, false หากไม่สำเร็จ
 */
const clearSchoolBillTokenCache = async (schoolId) => {
  try {
    if (!schoolId) {
      return false;
    }

    const schoolPremium = await School.findOne({ school: schoolId }).lean();
    if (!schoolPremium || new Date(schoolPremium.expiredDate) < new Date() || !parseFloat(schoolPremium.monthlyCredits)) {
      return false;
    }

    // สร้าง cache key
    const cacheKey = `school_bill_token:${schoolId}`;
    
    // ลบ cache หากมี Redis
    if (schoolBillCache) {
      try {
        const deleted = await schoolBillCache.delete(cacheKey);
        // if (deleted) {
        //   logger.debug(`[clearSchoolBillTokenCache] Successfully cleared cache for schoolId ${schoolId}`);
        // } else {
        //   logger.debug(`[clearSchoolBillTokenCache] No cache found for schoolId ${schoolId}`);
        // }
        return deleted;
      } catch (cacheError) {
        logger.warn(`[clearSchoolBillTokenCache] Cache delete error for schoolId ${schoolId}: ${cacheError.message}`);
        return false;
      }
    }

    return false;
  } catch (error) {
    logger.error(`[clearSchoolBillTokenCache] Error for schoolId ${schoolId}: ${error.message}`);
    return false;
  }
};

module.exports = {
  checkRefillPermission,
  checkUsagePermission,
  getSchoolKitBalanceConfig,
  getSchoolCurrentBillToken,
  clearSchoolBillTokenCache,
  checkSchoolPremiumMonthlyCredits,
};