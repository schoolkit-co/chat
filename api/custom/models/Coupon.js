const mongoose = require('mongoose');
const logger = require('~/config/winston');
const { deleteCouponLogs } = require('~/custom/utils/couponUtils');

const couponSchema = new mongoose.Schema(
  {
    couponCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    expiredDate: {
      type: Date,
      required: true,
    },
    credit: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { timestamps: true }
);

const Coupon = mongoose.model('Coupon', couponSchema);

const createCoupon = async (data) => {
  try {
    // ตรวจสอบข้อมูลที่จำเป็น
    if (!data || !data.couponCode) {
      throw new Error('กรุณาระบุรหัสคูปอง');
    }

    if (!data.credit) {
      throw new Error('กรุณาระบุจำนวนเครดิต');
    }

    if (!data.expiredDate) {
      throw new Error('กรุณาระบุวันหมดอายุ');
    }

    // ตรวจสอบว่ามีคูปองนี้อยู่แล้วหรือไม่
    const existingCoupon = await Coupon.findOne({ couponCode: data.couponCode });
    if (existingCoupon) {
      throw new Error('คูปองนี้มีอยู่ในระบบแล้ว');
    }

    // ตรวจสอบค่าเครดิต
    if (isNaN(data.credit) || data.credit < 0) {
      throw new Error('เครดิตต้องเป็นตัวเลขและไม่น้อยกว่า 0');
    }

    // แปลงวันที่และตรวจสอบความถูกต้อง
    const expiredDate = new Date(data.expiredDate);
    if (isNaN(expiredDate.getTime())) {
      throw new Error('รูปแบบวันหมดอายุไม่ถูกต้อง');
    }

    // สร้างคูปองใหม่
    const coupon = new Coupon({
      couponCode: data.couponCode,
      credit: Number(data.credit),
      expiredDate: expiredDate,
    });

    await coupon.save();
    return coupon;
  } catch (error) {
    logger.error(`Error in createCoupon: `, error);
    throw error;
  }
};

const getAllCoupons = async () => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    return coupons;
  } catch (error) {
    logger.error('Error in getAllCoupons: ', error);
    throw error;
  }
};

const getCouponByCode = async (couponCode) => {
  try {
    const coupon = await Coupon.findOne({ couponCode });
    if (!coupon) {
      throw new Error('ไม่พบคูปองที่ต้องการ');
    }
    return coupon;
  } catch (error) {
    logger.error(`Error in getCouponByCode [Code: ${couponCode}]: `, error);
    throw error;
  }
};

const updateCoupon = async (couponCode, data) => {
  try {
    const coupon = await Coupon.findOne({ couponCode });
    if (!coupon) {
      throw new Error('ไม่พบคูปองที่ต้องการแก้ไข');
    }

    // ตรวจสอบค่า credit
    if (data.credit !== undefined && data.credit < 0) {
      throw new Error('เครดิตต้องไม่น้อยกว่า 0');
    }

    // อัปเดตเฉพาะข้อมูลที่ส่งมา
    if (data.credit !== undefined) coupon.credit = data.credit;
    if (data.expiredDate) coupon.expiredDate = new Date(data.expiredDate);

    await coupon.save();
    return coupon;
  } catch (error) {
    logger.error(`Error in updateCoupon [Code: ${couponCode}]: `, error);
    throw error;
  }
};

const deleteCoupon = async (couponCode) => {
  try {
    const coupon = await Coupon.findOne({ couponCode });
    if (!coupon) {
      throw new Error('ไม่พบคูปองที่ต้องการลบ');
    }

    // ลบประวัติการใช้คูปอง
    await deleteCouponLogs(coupon._id, couponCode);

    // ลบคูปอง
    await coupon.deleteOne();

    logger.info(`Coupon deleted with all associated logs [Code: ${couponCode}]`);
    return { message: 'ลบคูปองและประวัติการใช้งานเรียบร้อยแล้ว' };
  } catch (error) {
    logger.error(`Error in deleteCoupon [Code: ${couponCode}]: `, error);
    throw error;
  }
};

module.exports = {
  Coupon,
  createCoupon,
  getAllCoupons,
  getCouponByCode,
  updateCoupon,
  deleteCoupon,
}; 