const express = require('express');
const router = express.Router();
const { requireJwtAuth } = require('~/server/middleware');
const { triggerAutoRefill } = require('~/custom/utils/balanceUtils');
const { clearSchoolBillTokenCacheController } = require('~/custom/controllers/cache');

// Endpoint to manually trigger auto-refill
router.post('/auto-refill', requireJwtAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await triggerAutoRefill(userId);
    
    if (!result) {
      return res.status(200).json({ 
        success: false, 
        message: 'การเติมเงินอัตโนมัติไม่สามารถดำเนินการได้ในขณะนี้ อาจเนื่องจากไม่ได้เปิดใช้งาน หรือยังไม่ถึงเวลาเติมเงิน'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'เติมเงินอัตโนมัติสำเร็จ',
      balance: result.balance
    });
  } catch (error) {
    console.error('[/balance/auto-refill] Error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการเติมเงินอัตโนมัติ'
    });
  }
});

// Endpoint to clear school bill token cache
router.post('/clear-school-cache', requireJwtAuth, clearSchoolBillTokenCacheController);

module.exports = router; 