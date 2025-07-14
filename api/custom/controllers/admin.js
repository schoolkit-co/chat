const mongoose = require('mongoose');
const { SystemRoles } = require('librechat-data-provider');
const School = require('~/custom/models/schema/school');
const { logger } = require('~/config');
const { deleteAllUserSessions, updateUser, findUser } = require('~/models');
const { setAuthTokens } = require('~/server/services/AuthService');
const { User } = require('~/db/models');

const getUserCountBySchoolController = async (req, res) => {
  try {
    // Aggregate users by school and count (excluding users with role 'ADMIN')
    const userCountBySchool = await User.aggregate([
      {
        $match: { role: { $ne: 'ADMIN' } }
      },
      {
        $group: {
          _id: "$school",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Get school credits information
    const schoolMonthlyCredits = {};
    const schoolIds = userCountBySchool.map(item => item._id).filter(id => id !== null);
    
    if (schoolIds.length > 0) {
      const schools = await School.find({ school: { $in: schoolIds } }).lean();
      schools.forEach(school => {
        if (school.monthlyCredits !== undefined) {
          schoolMonthlyCredits[school.school] = school.monthlyCredits;
        }
      });
    }

    // Get total count of all users (excluding ADMIN)
    const totalUsers = await User.countDocuments({ role: { $ne: 'ADMIN' } });

    // Get all schools that have users
    const schoolsWithUsers = await User.distinct('school', { school: { $ne: null } });
    
    // Count total schools in the system
    const totalSchools = schoolsWithUsers.length;
    
    res.status(200).json({
      userCountBySchool,
      schoolMonthlyCredits,
      totalUsers,
      totalSchools
    });
  } catch (error) {
    logger.error('Error fetching user count by school:', error);
    res.status(500).json({ message: 'Error fetching user count by school' });
  }
};

const getSchoolsWithoutAdminController = async (req, res) => {
  try {
    // Find all schools that have users
    const schoolsWithUsers = await User.distinct('school', { school: { $ne: null } });
    
    // Find schools that have admin
    const schoolsWithAdmin = await User.distinct('school', { 
      school: { $ne: null }, 
      schoolAdmin: true 
    });
    
    // Find schools without admin (difference between the two arrays)
    const schoolsWithoutAdmin = schoolsWithUsers.filter(school => !schoolsWithAdmin.includes(school));
    
    res.status(200).json({ schoolsWithoutAdmin });
  } catch (error) {
    logger.error('Error fetching schools without admin:', error);
    res.status(500).json({ message: 'Error fetching schools without admin' });
  }
};

/**
 * Get users without school
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const getUsersWithoutSchoolController = async (req, res) => {
  try {
    // Find users with no school or school: null
    const usersWithoutSchool = await User.find(
      { $or: [{ school: null }, { school: { $exists: false } }] },
      { password: 0, totpSecret: 0, __v: 0 } // Exclude sensitive fields
    ).lean();
    
    res.status(200).json(usersWithoutSchool);
  } catch (error) {
    logger.error('Error fetching users without school:', error);
    res.status(500).json({ message: 'Error fetching users without school' });
  }
};

/**
 * Get users by school ID
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const getUsersBySchoolController = async (req, res) => {
  try {
    const { schoolId } = req.params;
    
    if (!schoolId) {
      return res.status(400).json({ message: 'School ID is required' });
    }
    
    // Find users in the specified school
    const users = await User.find(
      { school: Number(schoolId) },
      { password: 0, totpSecret: 0, __v: 0 } // Exclude sensitive fields
    ).lean();
    
    res.status(200).json(users);
  } catch (error) {
    logger.error('Error fetching users by school:', error);
    res.status(500).json({ message: 'Error fetching users by school' });
  }
};

/**
 * Update user's schoolAdmin status
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const updateUserSchoolAdminController = async (req, res) => {
  try {
    const { userId } = req.params;
    const { schoolAdmin } = req.body;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    if (typeof schoolAdmin !== 'boolean') {
      return res.status(400).json({ message: 'schoolAdmin must be a boolean value' });
    }
    
    // Ensure only admin users can update schoolAdmin status
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Unauthorized: Only admin users can update schoolAdmin status' });
    }
    
    // Update the user's schoolAdmin status
    const user = await User.findByIdAndUpdate(
      userId,
      { schoolAdmin },
      { new: true, projection: { password: 0, totpSecret: 0, __v: 0 } }
    ).lean();
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json(user);
  } catch (error) {
    logger.error('Error updating schoolAdmin status:', error);
    res.status(500).json({ message: 'Error updating schoolAdmin status' });
  }
};

/**
 * Get schools with admin
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const getSchoolsWithAdminController = async (req, res) => {
  try {
    // Find schools that have admin
    const schoolsWithAdmin = await User.aggregate([
      { 
        $match: { 
          school: { $ne: null }, 
          schoolAdmin: true 
        } 
      },
      {
        $group: {
          _id: "$school",
          adminUsers: { 
            $push: { 
              _id: "$_id", 
              name: "$name", 
              email: "$email" 
            } 
          }
        }
      }
    ]);
    
    res.status(200).json({ schoolsWithAdmin });
  } catch (error) {
    logger.error('Error fetching schools with admin:', error);
    res.status(500).json({ message: 'Error fetching schools with admin' });
  }
};

/**
 * Update school for multiple users
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const updateUsersSchoolController = async (req, res) => {
  try {
    const { userIds, schoolId } = req.body;
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'User IDs are required as an array' });
    }
    
    if (!schoolId || isNaN(parseInt(schoolId))) {
      return res.status(400).json({ message: 'School ID is required' });
    }
    
    // Ensure only admin users can update school
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Unauthorized: Only admin users can update school' });
    }
    
    checkSchoolPremiumRegistration: {
      const school = await School.findOne({ school: schoolId }).lean();
      if (school && school.maxUsers) {
        const now = new Date();
        const expiredDate = new Date(school.expiredDate);
        if (now <= expiredDate) {
          const userCount = await User.countDocuments({ school: schoolId });
          if (userCount + userIds.length > school.maxUsers) {
            return res.status(403).json({ message: `User limit reached on Premium School (Max ${school.maxUsers}, Now ${userCount}, Try to Add ${userIds.length})` });
          }
        }
      }
    }

    // Update school for all users in the array
    const updateResult = await User.updateMany(
      { _id: { $in: userIds } },
      { school: schoolId }
    );

    for (let userId of userIds) {
      await deleteAllUserSessions({ userId });
    }
    
    res.status(200).json({ 
      message: 'Users updated successfully',
      modifiedCount: updateResult.modifiedCount 
    });
  } catch (error) {
    logger.error('Error updating users school:', error);
    res.status(500).json({ message: 'Error updating users school' });
  }
};

/**
 * Get users registered today
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const getUsersRegisteredTodayController = async (req, res) => {
  try {
    // สร้าง Date object สำหรับเวลาเริ่มต้นของวันนี้ (00:00:00)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // หาผู้ใช้ที่ลงทะเบียนในวันนี้ (createdAt >= เวลาเริ่มต้นของวันนี้)
    const usersRegisteredToday = await User.find(
      { createdAt: { $gte: today } },
      { password: 0, totpSecret: 0, __v: 0 } // ไม่รวมข้อมูลที่เป็นความลับ
    ).sort({ createdAt: -1 }).lean(); // เรียงตามเวลาการสร้างล่าสุดก่อน
    
    res.status(200).json(usersRegisteredToday);
  } catch (error) {
    logger.error('Error fetching users registered today:', error);
    res.status(500).json({ message: 'Error fetching users registered today' });
  }
};

const assignAdminRoleController = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required in the request body' });
    }
    const updatedUser = await updateUser(userId, { role: SystemRoles.ADMIN, school: null, schoolAdmin: false });
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    await deleteAllUserSessions({ userId });
    res.status(200).json({ message: 'User role updated to ADMIN' });
  } catch (error) {
    logger.error('[assignAdminRoleController]', error);
    res.status(500).json({ message: 'Error updating user role' });
  }
};

const assignUserRoleController = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required in the request body' });
    }
    const updatedUser = await updateUser(userId, { role: SystemRoles.USER });
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    await deleteAllUserSessions({ userId });
    res.status(200).json({ message: 'User role updated to USER' });
  } catch (error) {
    logger.error('[assignUserRoleController]', error);
    res.status(500).json({ message: 'Error updating user role' });
  }
};

// เพิ่มฟังก์ชันสำหรับค้นหาผู้ใช้โดยชื่อหรืออีเมล
const searchUsersController = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters' });
    }

    // ค้นหาผู้ใช้โดยชื่อหรืออีเมล (ไม่คำนึงถึงตัวพิมพ์ใหญ่-เล็ก)
    const users = await User.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { firstname: { $regex: q, $options: 'i' } },
        { lastname: { $regex: q, $options: 'i' } },
      ]
    }).limit(10).lean();

    // เพิ่มข้อมูลโรงเรียนให้กับผู้ใช้
    const enhancedUsers = await Promise.all(users.map(async (user) => {
      const result = { ...user };

      // ลบฟิลด์ที่ละเอียดอ่อน
      delete result.password;
      delete result.totpSecret;
      delete result.__v;

      return result;
    }));
    
    res.status(200).json(enhancedUsers);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ message: 'Error searching users' });
  }
};

// เพิ่มฟังก์ชันสำหรับดึงข้อมูลแบลนซ์ของผู้ใช้ตาม ID
const getUserBalanceController = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    const { Balance } = require('~/db/models');
    const balance = await Balance.findOne({ user: userId }).lean();
    
    if (!balance) {
      return res.status(404).json({ message: 'Balance not found for this user' });
    }
    
    res.status(200).json(balance);
  } catch (error) {
    logger.error('Error fetching user balance:', error);
    res.status(500).json({ message: 'Error fetching user balance' });
  }
};

/**
 * Update user's superCredit status
 * @param {Request} req - Express request object. req.body.superCredit should be set by middleware.
 * @param {Response} res - Express response object
 */
const updateUserSuperCreditController = async (req, res) => {
  try {
    const { userId, superCredit } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    if (typeof superCredit !== 'boolean') {
      // This should ideally be caught by middleware or route handler logic before this controller
      return res.status(400).json({ message: 'superCredit must be a boolean value' });
    }

    // The checkAdmin middleware already verified the requesting user is an admin
    // updateUser function likely handles finding the user and updating
    const user = await User.findByIdAndUpdate(
      userId,
      { superCredit },
      { new: true, projection: { password: 0, totpSecret: 0, __v: 0 } }
    ).lean();

    // ตรวจสอบว่าพบผู้ใช้หรือไม่
    if (!user) {
      return res.status(404).json({ message: 'User not found or update failed' });
    }

    setNewBalance: {
      const { Balance } = require('~/db/models');
      let balance = await Balance.findOne({ user: userId });
      if (balance) {
        balance.tokenCredits = superCredit ? 900000000 : (parseInt(process.env.START_BALANCE, 10) || 0);
      } else {
        balance = new Balance({
          user: userId,
          tokenCredits: superCredit ? 900000000 : (parseInt(process.env.START_BALANCE, 10) || 0),
        });
      }
      await balance.save();
    }

    // It might be good to clear user sessions after changing permissions/status
    await deleteAllUserSessions({ userId });

    // Respond with the updated status or a success message
    res.status(200).json({ message: `User superCredit status updated to ${superCredit}` });
  } catch (error) {
    logger.error('Error updating superCredit status:', error);
    if (error.message && error.message.includes('User not found')) { // Example of specific error handling
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(500).json({ message: 'Error updating superCredit status' });
  }
};

/**
 * Admin impersonation controller
 * Allows admins to log in as any user by email
 * Bypasses all authentication checks (password, 2FA, ban)
 */
const adminImpersonateController = async (req, res) => {
  try {
    // Check if the requesting user is an admin (should already be checked by middleware but verify again)
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Forbidden: Admin privileges required' });
    }

    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Find user by email
    const targetUser = await findUser({ email: email.trim() });
    
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Log the impersonation attempt for security audit
    logger.warn(`[adminImpersonateController] Admin ${req.user.email} (${req.user._id}) impersonating user ${targetUser.email} (${targetUser._id})`);

    // Set auth tokens as the target user
    const token = await setAuthTokens(targetUser._id, res);

    // Prepare sanitized user data to return
    const { password: _p, totpSecret: _t, __v, ...user } = targetUser;
    user.id = user._id.toString();

    return res.status(200).send({ 
      token, 
      user,
      impersonated: true,
      impersonatedBy: req.user.email 
    });
  } catch (err) {
    logger.error('[adminImpersonateController]', err);
    return res.status(500).json({ message: 'Something went wrong' });
  }
};

module.exports = {
  getUserCountBySchoolController,
  getSchoolsWithoutAdminController,
  getUsersWithoutSchoolController,
  getUsersBySchoolController,
  updateUserSchoolAdminController,
  getSchoolsWithAdminController,
  updateUsersSchoolController,
  getUsersRegisteredTodayController,
  assignAdminRoleController,
  assignUserRoleController,
  searchUsersController,
  getUserBalanceController,
  updateUserSuperCreditController,
  adminImpersonateController,
};