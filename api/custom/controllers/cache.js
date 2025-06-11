const { logger } = require('~/config');
const { clearSchoolBillTokenCache } = require('../models/balanceUtil');

/**
 * Controller สำหรับลบ cache ของ school bill token
 * ใช้โดย school user เท่านั้น
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const clearSchoolBillTokenCacheController = async (req, res) => {
  try {
    // ตรวจสอบว่าผู้ใช้มีโรงเรียนหรือไม่
    if (!req.user.school) {
      return res.status(400).json({ 
        success: false,
        message: 'ผู้ใช้ไม่ได้เป็นสมาชิกของโรงเรียนใดๆ' 
      });
    }

    const schoolId = req.user.school;
    
    // เรียกใช้ฟังก์ชันลบ cache
    const result = await clearSchoolBillTokenCache(schoolId);
    
    if (result) {
      res.status(200).json({
        success: true,
        message: 'ลบ cache ของ school bill token สำเร็จ',
        schoolId
      });
    } else {
      res.status(200).json({
        success: false,
        message: 'ไม่พบ cache ที่ต้องลบ หรือโรงเรียนไม่มีสิทธิ์ใช้งาน',
        schoolId
      });
    }
  } catch (error) {
    logger.error('[clearSchoolBillTokenCacheController] Error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการลบ cache'
    });
  }
};

module.exports = {
  clearSchoolBillTokenCacheController,
}; 