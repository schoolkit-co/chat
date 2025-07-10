const express = require('express');
const { requireJwtAuth, checkAdmin } = require('~/server/middleware');
const {
  createCoupon,
  getAllCoupons,
  getCouponByCode,
  updateCoupon,
  deleteCoupon
} = require('../models/Coupon');
const { redeemCoupon, getUserCouponLogs } = require('../models/CouponLog');

const router = express.Router();

/**
 * @route GET /api/coupon
 * @desc ดึงข้อมูลคูปองทั้งหมด
 * @access Private Admin
 */
router.get('/', requireJwtAuth, checkAdmin, async (req, res) => {
  try {
    const coupons = await getAllCoupons();
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ message: error.message || 'เกิดข้อผิดพลาด ไม่สามารถดึงข้อมูลคูปองได้' });
  }
});

/**
 * @route GET /api/coupon/logs/me
 * @desc ดึงประวัติการใช้คูปองของตัวเอง
 * @access Private
 */
router.get('/logs/me', requireJwtAuth, async (req, res) => {
  try {
    const logs = await getUserCouponLogs(req.user.id);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message || 'เกิดข้อผิดพลาด ไม่สามารถดึงประวัติการใช้คูปองได้' });
  }
});

/**
 * @route GET /api/coupon/:couponcode
 * @desc ดึงข้อมูลคูปองตามรหัสคูปอง
 * @access Private Admin
 */
router.get('/:couponcode', requireJwtAuth, checkAdmin, async (req, res) => {
  try {
    const couponCode = req.params?.couponcode?.trim();
    if (!couponCode) {
      return res.status(400).json({ message: 'กรุณาระบุรหัสคูปอง' });
    }
    const coupon = await getCouponByCode(couponCode);
    res.json(coupon);
  } catch (error) {
    if (error.message === 'ไม่พบคูปองที่ต้องการ') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message || 'เกิดข้อผิดพลาด ไม่สามารถดึงข้อมูลคูปองได้' });
  }
});

/**
 * @route POST /api/coupon
 * @desc สร้างคูปองใหม่
 * @access Private Admin
 */
router.post('/', requireJwtAuth, checkAdmin, async (req, res) => {
  try {
    const { couponCode, credit, expiredDate } = req.body;
    
    // ตรวจสอบข้อมูลที่จำเป็น
    if (!couponCode) {
      return res.status(400).json({ message: 'กรุณาระบุรหัสคูปอง' });
    }
    
    if (!credit || isNaN(credit)) {
      return res.status(400).json({ message: 'กรุณาระบุเครดิตเป็นตัวเลข' });
    }
    
    if (!expiredDate) {
      return res.status(400).json({ message: 'กรุณาระบุวันหมดอายุ' });
    }
    
    // สร้างคูปอง
    const coupon = await createCoupon({
      couponCode: couponCode.trim(),
      credit: Number(credit),
      expiredDate,
    });
    
    res.status(201).json(coupon);
  } catch (error) {
    if (error.message === 'คูปองนี้มีอยู่ในระบบแล้ว' || error.message === 'เครดิตต้องไม่น้อยกว่า 0') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message || 'เกิดข้อผิดพลาด ไม่สามารถสร้างคูปองได้' });
  }
});

/**
 * @route PUT /api/coupon/:couponcode
 * @desc อัปเดตข้อมูลคูปอง
 * @access Private Admin
 */
router.put('/:couponcode', requireJwtAuth, checkAdmin, async (req, res) => {
  try {
    const couponCode = req.params?.couponcode?.trim();
    if (!couponCode) {
      return res.status(400).json({ message: 'กรุณาระบุรหัสคูปอง' });
    }
    const coupon = await updateCoupon(couponCode, req.body);
    res.json(coupon);
  } catch (error) {
    if (error.message === 'ไม่พบคูปองที่ต้องการแก้ไข' || 
        error.message === 'เครดิตต้องไม่น้อยกว่า 0') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message || 'เกิดข้อผิดพลาด ไม่สามารถอัปเดตคูปองได้' });
  }
});

/**
 * @route DELETE /api/coupon/:couponcode
 * @desc ลบคูปอง
 * @access Private Admin
 */
router.delete('/:couponcode', requireJwtAuth, checkAdmin, async (req, res) => {
  try {
    const couponCode = req.params?.couponcode?.trim();
    if (!couponCode) {
      return res.status(400).json({ message: 'กรุณาระบุรหัสคูปอง' });
    }
    const result = await deleteCoupon(couponCode);
    res.json(result);
  } catch (error) {
    if (error.message === 'ไม่พบคูปองที่ต้องการลบ') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message || 'เกิดข้อผิดพลาด ไม่สามารถลบคูปองได้' });
  }
});

/**
 * @route POST /api/coupon/redeem
 * @desc ใช้คูปองเพื่อรับเครดิต
 * @access Private
 */
router.post('/redeem', requireJwtAuth, async (req, res) => {
  try {
    const { couponCode } = req.body;
    const result = await redeemCoupon(req.user.id, couponCode);
    res.json(result);
  } catch (error) {
    const errorMessages = [
      'ไม่พบคูปองที่ระบุ',
      'คูปองนี้หมดอายุแล้ว',
      'คุณเคยใช้คูปองนี้ไปแล้ว'
    ];
    
    if (errorMessages.includes(error.message)) {
      return res.status(400).json({ message: error.message });
    }
    
    res.status(500).json({ message: error.message || 'เกิดข้อผิดพลาด ไม่สามารถใช้คูปองได้' });
  }
});

module.exports = router; 