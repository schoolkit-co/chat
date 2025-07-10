const express = require('express');
const { checkAdmin, requireJwtAuth } = require('~/server/middleware');
const { logger } = require('~/config');

const {
  calcBillPeriod,
  createSchoolPremium,
  readSchoolPremium,
  readAllSchoolPremium,
  updateSchoolPremium,
} = require('~/custom/models/SchoolPremium');

const { getSchoolCurrentBillToken } = require('~/custom/models/balanceUtil');
const School = require('~/custom/models/schema/school');

const router = express.Router();

// routes ที่ต้องการสิทธิ์ ADMIN
// ใช้ middleware เฉพาะเส้นทางที่ต้องการสิทธิ์ ADMIN

// GET /api/school/premium/all
router.get('/premium/all', requireJwtAuth, checkAdmin, async (req, res) => {
  try {
    const result = await readAllSchoolPremium(req.user);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// POST /api/school/premium/update - สำหรับทั้งการสร้างและอัปเดตข้อมูล
router.post('/premium/update', requireJwtAuth, checkAdmin, async (req, res) => {
  try {
    let result;
    // ตรวจสอบว่าเป็นการสร้างหรืออัปเดต โดยดูจาก id ในข้อมูลที่ส่งมา
    if (!req.body.id) {
      // กรณีไม่มี id ให้สร้างใหม่
      result = await createSchoolPremium(req.user, req.body);
      res.status(201).json(result);
    } else {
      // กรณีมี id ให้อัปเดต
      result = await updateSchoolPremium(req.user, req.body);
      res.status(200).json(result);
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// GET /api/school/premium/:school - สามารถเข้าถึงได้โดยผู้ใช้ทั่วไปที่เข้าสู่ระบบแล้ว
router.get('/premium/:school', requireJwtAuth, async (req, res) => {
  try {
    const schoolId = parseInt(req.params.school);
    if (isNaN(schoolId)) {
      return res.status(400).json({ message: 'Invalid school ID' });
    }
    
    const result = await readSchoolPremium(req.user, schoolId);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// GET /api/school/period/:schoolId
router.get('/period/:schoolId', async (req, res) => {
  try {
    const schoolId = parseInt(req.params.schoolId);
    if (isNaN(schoolId)) {
      return res.status(400).json({ message: 'Invalid school ID' });
    }

    const result = await calcBillPeriod(schoolId);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// GET /api/school/balance - ตรวจสอบยอดเงินคงเหลือของโรงเรียนสำหรับผู้ใช้ที่เข้าสู่ระบบ
/**
 * ตรวจสอบยอดเงินคงเหลือของโรงเรียน
 * คำนวณจาก: 2,000,000 - totalTokenValue ของรอบบิลปัจจุบัน
 * 
 * @route GET /api/school/balance
 * @access Private (ต้องเข้าสู่ระบบและเป็นสมาชิกของโรงเรียน)
 * @returns {Object} ข้อมูลยอดเงินคงเหลือและรายละเอียดการใช้งาน
 * @returns {Number} schoolId - รหัสโรงเรียน
 * @returns {Number} totalTokenValue - จำนวน token ที่ใช้ไปในรอบบิลปัจจุบัน
 * @returns {Number} remainingBalance - ยอดเงินคงเหลือ (2,000,000 - totalTokenValue)
 * @returns {Date} periodStart - วันที่เริ่มต้นรอบบิล
 * @returns {Date} periodEnd - วันที่สิ้นสุดรอบบิล
 * @returns {Number} transactionCount - จำนวน transaction ทั้งหมดในรอบบิล
 * @returns {Object} tokenSummary - สรุปการใช้งาน token แยกตามประเภท
 */
router.get('/balance', requireJwtAuth, async (req, res) => {
  try {
    // ตรวจสอบว่าผู้ใช้มีโรงเรียนหรือไม่
    if (!req.user.school) {
      return res.status(400).json({ message: 'User is not associated with any school' });
    }

    const schoolId = req.user.school;
    
    // check school premium credits
    const schoolPremium = await School.findOne({ school: schoolId }).lean();
    const schoolMonthlyCredits = schoolPremium?.monthlyCredits || 0;
    if (!schoolMonthlyCredits || schoolMonthlyCredits <= 0) {
      return res.status(400).json({ message: 'School premium is user-limited base' });
    }

    // ดึงข้อมูล token ที่ใช้ไปในรอบบิลปัจจุบัน
    const billTokenData = await getSchoolCurrentBillToken(schoolId);
    
    // คำนวณยอดเงินคงเหลือ
    const remainingBalance = schoolMonthlyCredits + billTokenData.totalTokenValue;
    
    res.status(200).json({
      schoolId,
      totalTokenValue: billTokenData.totalTokenValue,
      remainingBalance,
      periodStart: billTokenData.periodStart,
      periodEnd: billTokenData.periodEnd,
      transactionCount: billTokenData.transactionCount,
      tokenSummary: billTokenData.tokenSummary
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;