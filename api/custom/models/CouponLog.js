const mongoose = require('mongoose');
const logger = require('~/config/winston');
const Balance = mongoose.models.Balance;
const { triggerAutoRefill } = require('~/custom/controllers/balance');

const couponLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    coupon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coupon',
      required: true,
    },
  },
  { timestamps: true }
);

// สร้าง compound index เพื่อป้องกันการใช้คูปองซ้ำโดยผู้ใช้คนเดียวกัน
couponLogSchema.index({ user: 1, coupon: 1 }, { unique: true });

const CouponLog = mongoose.model('CouponLog', couponLogSchema);

const redeemCoupon = async (userId, couponCode) => {
  try {
    // ย้ายการ require เข้ามาในฟังก์ชันเพื่อแก้ circular dependency
    const Coupon = mongoose.model('Coupon');
    
    // ตรวจสอบว่าคูปองมีอยู่หรือไม่
    const coupon = await Coupon.findOne({ couponCode });
    if (!coupon) {
      throw new Error('คูปองไม่ถูกต้อง');
    }

    // ตรวจสอบว่าคูปองหมดอายุหรือยัง
    if (new Date() > new Date(coupon.expiredDate)) {
      throw new Error('คูปองหมดอายุแล้ว');
    }

    // ตรวจสอบว่าผู้ใช้เคยใช้คูปองนี้หรือไม่
    const existingLog = await CouponLog.findOne({
      user: userId,
      coupon: coupon._id,
    });
    if (existingLog) {
      throw new Error('คุณเคยใช้คูปองนี้ไปแล้ว');
    }

    await triggerAutoRefill(userId);

    // เพิ่มวันใช้งาน
    let balance = await Balance.findOne({ user: userId });
    let demoTrialDays = parseInt(process.env.TRIAL_DAYS, 10) || 14;
    let extendedExpiry = new Date();
    extendedExpiry.setDate(extendedExpiry.getDate() + demoTrialDays + 1);
    extendedExpiry.setHours(0, 0, 0, 0);
    extendedExpiry.setHours(extendedExpiry.getHours() - 7);
    if (balance?.expiredDate) {
      let balanceExpiredDate = new Date(balance.expiredDate);
      balance.expiredDate = extendedExpiry > balanceExpiredDate ? extendedExpiry : balanceExpiredDate;
    } else {
      balance.expiredDate = extendedExpiry;
    }
    
    // เพิ่มเครดิต
    balance.tokenCredits = (balance.tokenCredits || 0) + coupon.credit;
    
    // บันทึกการเปลี่ยนแปลง
    await balance.save();

    // บันทึกประวัติการใช้คูปอง
    const couponLog = new CouponLog({
      user: userId,
      coupon: coupon._id,
    });
    await couponLog.save();
    return { credit: coupon.credit, message: 'แลกคูปองสำเร็จแล้ว', balance: balance.tokenCredits };
  } catch (error) {
    logger.error(`Error redeeming ${couponCode} coupon for user ${userId}: `, error);
    throw error;
  }
};

// ดึงประวัติการใช้คูปองของผู้ใช้
const getUserCouponLogs = async (userId) => {
  try {
    const logs = await CouponLog.find({ user: userId })
      .populate({
        path: 'coupon',
        select: 'couponCode credit',
      })
      .lean();

    // จัดข้อมูลให้ดูง่ายขึ้น
    const formattedLogs = logs.map((log) => {
      return {
        id: log._id,
        couponCode: log.coupon ? log.coupon.couponCode : 'รหัสคูปองไม่พบ',
        credit: log.credit,
        redeemedAt: log.createdAt,
      };
    });

    return formattedLogs;
  } catch (error) {
    logger.error(`Error getting coupon logs for user ${userId}: `, error);
    throw error;
  }
};

// ลบประวัติการใช้คูปองตาม couponCode
const deleteCouponLogs = async (couponCode) => {
  try {
    // ค้นหา coupon ID จาก couponCode ก่อน
    const Coupon = mongoose.model('Coupon');
    const coupon = await Coupon.findOne({ couponCode });
    
    if (!coupon) {
      logger.warn(`Coupon not found for deletion of logs: ${couponCode}`);
      return { deletedCount: 0 };
    }
    
    // ลบประวัติด้วย coupon ID
    const result = await CouponLog.deleteMany({ coupon: coupon._id });
    logger.info(`Deleted ${result.deletedCount} coupon logs for coupon: ${couponCode}`);
    return result;
  } catch (error) {
    logger.error(`Error in deleteCouponLogs [Code: ${couponCode}]: `, error);
    throw error;
  }
};

module.exports = {
  CouponLog,
  redeemCoupon,
  getUserCouponLogs,
  deleteCouponLogs
}; 