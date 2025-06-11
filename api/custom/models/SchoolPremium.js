const dayjs = require('dayjs');
const mongoose = require('mongoose');
const School = require('./schema/school');
const logger = require('~/config/winston');
const { SystemRoles } = require('librechat-data-provider');
const User = mongoose.models.User;

/**
 * คำนวณรอบบิลจาก expiredDate ของโรงเรียน
 * @param {Object} school - อ็อบเจกต์โรงเรียน (ต้องมี expiredDate)
 * @returns {{ periodStart: Date, periodEnd: Date }}
 */
const calcBillPeriod = async (schoolId) => {
  let school = await School.findOne({ school: schoolId }).lean();
  if (!school || !school.expiredDate) {
    throw new Error('school is not premium');
  }
  const now = dayjs();
  const expired = dayjs(school.expiredDate);
  if (expired < now) {
    throw new Error('school premium is expired');
  }
  // หา periodEnd: วันที่เดียวกับ expiredDate แต่เป็นเดือนถัดไปที่ใกล้กับปัจจุบัน (periodEnd > now, periodEnd - now < 1 เดือน)
  let periodEnd = expired.set('year', now.year()).set('month', now.month());
  if (periodEnd.isBefore(now) || periodEnd.isSame(now, 'day')) {
    periodEnd = periodEnd.add(1, 'month');
  }
  // หา periodStart: วันที่เดียวกับ expiredDate แต่เป็นเดือนก่อนหน้าที่ใกล้กับปัจจุบัน (now > periodStart, now - periodStart < 1 เดือน)
  let periodStart = periodEnd.subtract(1, 'month');
  return {
    periodStart: periodStart.toDate(),
    periodEnd: periodEnd.toDate(),
  };
}

/**
 * Check if a school has reached its user limit or has expired
 * @param {Number} schoolId - School ID to check
 * @returns {Promise<Object>} Result of the check
 */
const checkSchoolPremiumRegistration = async (schoolId) => {
  try {
    // ตรวจสอบว่าเป็น ID โรงเรียนที่ถูกต้องหรือไม่
    if (!schoolId || isNaN(parseInt(schoolId))) {
      return { canRegister: true };
    }
    
    // ดึงข้อมูล Premium ของโรงเรียน
    const school = await School.findOne({ school: schoolId }).lean();
    
    // ถ้าไม่มีข้อมูล Premium แสดงว่าโหมด Demo สามารถเพิ่มผู้ใช้ได้
    if (!school || !school.maxUsers) {
      return { canRegister: true };
    }
    
    // ตรวจสอบวันหมดอายุ
    const now = new Date();
    const expiredDate = new Date(school.expiredDate);
    
    // ถ้าหมดอายุแล้ว เข้าสู่โหมด Demo สามารถเพิ่มผู้ใช้ได้
    if (now > expiredDate) {
      return { canRegister: true };
    }
    
    // นับจำนวนผู้ใช้ในโรงเรียน
    const userCount = await User.countDocuments({ school: schoolId });
    
    // ถ้าจำนวนผู้ใช้น้อยกว่าที่กำหนด สามารถเพิ่มผู้ใช้ได้
    if (userCount < school.maxUsers) {
      return { canRegister: true };
    }
    
    // ถ้าจำนวนผู้ใช้เต็มแล้ว ไม่สามารถเพิ่มผู้ใช้ได้
    return { 
      canRegister: false, 
      message: `ไม่สามารถเพิ่มผู้ใช้ได้เนื่องจากโรงเรียนนี้มีผู้ใช้ครบ ${school.maxUsers} คนแล้ว กรุณาติดต่อผู้ดูแลระบบ`,
      maxUsers: school.maxUsers,
      currentUsers: userCount,
      expiredDate: school.expiredDate
    };
  } catch (error) {
    logger.error(`[SchoolPremium] Check error: ${error.message}`);
    return { canRegister: false };
  }
};

/**
 * Create a new school premium entry
 * @param {Object} user - The user making the request
 * @param {Object} schoolData - School premium data
 * @returns {Promise<Object>} Created school premium object
 */
const createSchoolPremium = async (user, schoolData) => {
  try {
    if (user.role !== SystemRoles.ADMIN) {
      throw new Error('Permission denied: Only ADMIN can create school premium');
    }

    const { school, expiredDate, maxUsers, monthlyCredits } = schoolData;
    
    const existingSchool = await School.findOne({ school }).lean();
    if (existingSchool) {
      throw new Error(`School with ID ${school} already exists`);
    }

    const newSchool = new School({
      school,
      expiredDate,
      maxUsers,
      monthlyCredits,
    });

    await newSchool.save();
    return newSchool;
  } catch (error) {
    logger.error(`[SchoolPremium] Create error: ${error.message}`);
    throw error;
  }
};

/**
 * Get a school premium entry by school ID
 * @param {Object} user - The user making the request
 * @param {Number} schoolId - School ID
 * @returns {Promise<Object>} School premium object
 */
const readSchoolPremium = async (user, schoolId) => {
  try {
    const school = await School.findOne({ school: schoolId }).lean();
    if (!school) {
      throw new Error(`School with ID ${schoolId} not found`);
    }

    return school;
  } catch (error) {
    logger.error(`[SchoolPremium] Read error: ${error.message}`);
    throw error;
  }
};

/**
 * Get all school premium entries
 * @param {Object} user - The user making the request
 * @returns {Promise<Array>} Array of school premium objects
 */
const readAllSchoolPremium = async (user) => {
  try {
    if (user.role !== SystemRoles.ADMIN) {
      throw new Error('Permission denied: Only ADMIN can read all school premium');
    }

    const schools = await School.find({});
    return schools;
  } catch (error) {
    logger.error(`[SchoolPremium] Read All error: ${error.message}`);
    throw error;
  }
};

/**
 * Update a school premium entry
 * @param {Object} user - The user making the request
 * @param {Object} schoolData - Updated school premium data
 * @returns {Promise<Object>} Updated school premium object
 */
const updateSchoolPremium = async (user, schoolData) => {
  try {
    if (user.role !== SystemRoles.ADMIN) {
      throw new Error('Permission denied: Only ADMIN can update school premium');
    }

    const { school, expiredDate, maxUsers, monthlyCredits } = schoolData;
    
    // Prepare update operations
    const updateOps = {};
    const unsetOps = {};
    
    // Handle expiredDate
    if (expiredDate !== undefined) {
      updateOps.expiredDate = expiredDate;
    }
    
    // Handle maxUsers
    if (maxUsers !== undefined && maxUsers !== null) {
      updateOps.maxUsers = maxUsers;
    } else if (schoolData.hasOwnProperty('maxUsers') && (maxUsers === undefined || maxUsers === null)) {
      // If maxUsers is explicitly set to undefined or null, remove it
      unsetOps.maxUsers = 1;
    }
    
    // Handle monthlyCredits
    if (monthlyCredits !== undefined && monthlyCredits !== null) {
      updateOps.monthlyCredits = monthlyCredits;
    } else if (schoolData.hasOwnProperty('monthlyCredits') && (monthlyCredits === undefined || monthlyCredits === null)) {
      // If monthlyCredits is explicitly set to undefined or null, remove it
      unsetOps.monthlyCredits = 1;
    }
    
    // Build the update query
    const updateQuery = {};
    if (Object.keys(updateOps).length > 0) {
      updateQuery.$set = updateOps;
    }
    if (Object.keys(unsetOps).length > 0) {
      updateQuery.$unset = unsetOps;
    }
    
    // Use findOneAndUpdate with upsert to create if doesn't exist
    const updatedSchool = await School.findOneAndUpdate(
      { school },
      updateQuery,
      { 
        new: true, 
        upsert: true,
        runValidators: true 
      }
    );

    return updatedSchool;
  } catch (error) {
    logger.error(`[SchoolPremium] Update error: ${error.message}`);
    throw error;
  }
};

module.exports = {
  calcBillPeriod,
  checkSchoolPremiumRegistration,
  createSchoolPremium,
  readSchoolPremium,
  readAllSchoolPremium,
  updateSchoolPremium,
};