const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { logger } = require('~/config');
const { deleteAllUserSessions } = require('~/models');
const User = mongoose.models.User;
const { checkSchoolPremiumRegistration } = require('~/custom/models/SchoolPremium');

/**
 * ตรวจสอบว่าอีเมลมีอยู่แล้วหรือไม่ และสามารถให้สิทธิ์โรงเรียนได้หรือไม่
 */
const checkEmailController = async (req, res) => {
  try {
    const { email } = req.body;
    const { user } = req;

    if (!user.schoolAdmin) {
      return res.status(403).json({ message: 'คุณไม่มีสิทธิ์ในการตรวจสอบอีเมล' });
    }

    if (!email) {
      return res.status(400).json({ message: 'ต้องระบุอีเมล' });
    }

    // ตรวจสอบว่าอีเมลมีอยู่แล้วหรือไม่
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      // ถ้ามีอยู่แล้ว ตรวจสอบว่าสามารถให้สิทธิ์โรงเรียนได้หรือไม่
      if (typeof existingUser.school === 'number') {
        return res.status(200).json({ 
          exists: true, 
          canAssign: false,
          message: 'บัญชีนี้มีอยู่แล้วและไม่สามารถกำหนดโรงเรียนให้ได้ เนื่องจากถูกกำหนดโรงเรียนไปแล้ว'
        });
      } else {
        return res.status(200).json({ 
          exists: true, 
          canAssign: true,
          message: 'บัญชีนี้มีอยู่แล้วและสามารถกำหนดโรงเรียนให้ได้'
        });
      }
    } else {
      return res.status(200).json({ 
        exists: false, 
        canAssign: true,
        message: 'บัญชีนี้ยังไม่มีในระบบ สามารถลงทะเบียนได้'
      });
    }
  } catch (error) {
    logger.error('Error checking email:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการตรวจสอบอีเมล' });
  }
};

/**
 * สร้างผู้ใช้ใหม่โดย school admin หรือให้สิทธิ์โรงเรียนกับผู้ใช้ที่มีอยู่แล้ว
 */
const createUserBySchoolAdminController = async (req, res) => {
  try {
    const { email, name, username, password } = req.body;
    const { user } = req;

    if (!user.schoolAdmin) {
      return res.status(403).json({ message: 'คุณไม่มีสิทธิ์ในการสร้างบัญชีผู้ใช้' });
    }

    if (!email) {
      return res.status(400).json({ message: 'ต้องระบุอีเมล' });
    }

    // ตรวจสอบว่าอีเมลมีอยู่แล้วหรือไม่
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      // ถ้ามีอยู่แล้ว ตรวจสอบว่าสามารถให้สิทธิ์โรงเรียนได้หรือไม่
      if (typeof existingUser.school === 'number') {
        return res.status(400).json({ message: 'บัญชีนี้มีอยู่แล้วและไม่สามารถกำหนดโรงเรียนให้ได้ เนื่องจากถูกกำหนดโรงเรียนไปแล้ว' });
      }
    }

    // ตรวจสอบสิทธิ์ premium ของโรงเรียน
    const premiumCheck = await checkSchoolPremiumRegistration(user.school);
    if (!premiumCheck.canRegister) {
      return res.status(403).json({ message: premiumCheck.message });
    }

    if (existingUser) {
      // อัปเดตข้อมูลผู้ใช้ที่มีอยู่แล้ว
      existingUser.school = user.school;
      await existingUser.save();
      await deleteAllUserSessions({ userId: user._id });

      return res.status(200).json({ 
        message: 'อัปเดตข้อมูลผู้ใช้สำเร็จ',
        user: {
          _id: existingUser._id,
          email: existingUser.email,
          name: existingUser.name,
          school: existingUser.school
        }
      });
    } else {
      // ถ้าไม่มีผู้ใช้อยู่ สร้างผู้ใช้ใหม่
      if (!name || !password) {
        return res.status(400).json({ message: 'ต้องระบุชื่อและรหัสผ่าน' });
      }

      // ตรวจสอบว่ามีชื่อผู้ใช้อยู่แล้วหรือไม่ (เฉพาะกรณีที่มีการระบุ username)
      if (username) {
        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
          return res.status(400).json({ message: 'ชื่อผู้ใช้นี้มีอยู่แล้ว' });
        }
      }

      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync(password, salt);
      
      const newUserData = {
        email,
        name,
        avatar: null,
        password: hashedPassword,
        school: user.school,
        role: 'USER',
        emailVerified: true // ข้ามขั้นตอนการยืนยันอีเมล
      };

      // ถ้ามีการระบุ username ให้เพิ่มเข้าไปในข้อมูล
      if (username) {
        newUserData.username = username;
      }

      const newUser = new User(newUserData);
      await newUser.save();

      return res.status(201).json({ 
        message: 'สร้างบัญชีผู้ใช้สำเร็จ',
        user: {
          _id: newUser._id,
          email: newUser.email,
          name: newUser.name,
          school: newUser.school
        }
      });
    }
  } catch (error) {
    logger.error('Error creating user by school admin:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสร้างบัญชีผู้ใช้' });
  }
};

/**
 * นำเข้าผู้ใช้หลายคนจากไฟล์ XLSX
 */
const importUsersFromXlsxController = async (req, res) => {
  try {
    const { users } = req.body;
    const requestUser = await User.findById(req.user.id);
    const isGlobalAdmin = requestUser?.role === 'ADMIN';
    const isSchoolAdmin = requestUser?.schoolAdmin && requestUser?.school;
    const isAdmin = isGlobalAdmin || isSchoolAdmin;
    
    if (!isAdmin) {
      return res.status(403).json({ message: 'ไม่มีสิทธิ์ในการนำเข้าผู้ใช้' });
    }

    const results = {
      success: [],
      failed: []
    };

    for (const userData of users) {
      try {
        const { email, name, password } = userData;

        // ตรวจสอบสิทธิ์ premium ของโรงเรียน (เฉพาะกรณี school admin)
        if (isSchoolAdmin) {
          const premiumCheck = await checkSchoolPremiumRegistration(requestUser.school);
          if (!premiumCheck.canRegister) {
            results.failed.push({
              email,
              reason: premiumCheck.message
            });
            continue;
          }
        }

        // ตรวจสอบว่ามีอีเมลนี้ในระบบหรือไม่
        const existingUser = await User.findOne({ email });

        if (existingUser) {
          // กรณีที่มีอีเมลอยู่แล้ว และไม่มีโรงเรียน
          if (isSchoolAdmin && !existingUser.school) {
            // อัพเดทโรงเรียนให้เป็นโรงเรียนเดียวกับ school admin
            await User.findByIdAndUpdate(existingUser._id, {
              school: requestUser.school
            });
            results.success.push({
              email,
              name: existingUser.name,
              status: 'อัพเดทโรงเรียนสำเร็จ'
            });
            await deleteAllUserSessions({ userId: existingUser._id });
          } 
          // กรณีที่มีอีเมลอยู่แล้ว และมีโรงเรียนแล้ว
          else {
            results.failed.push({
              email,
              reason: 'มีบัญชีผู้ใช้นี้ในระบบแล้ว'
            });
          }
          continue;
        }

        if (password?.length < 8) {
          results.failed.push({
            password,
            reason: 'รหัสผ่านสั้นกว่า 8 ตัวอักษร'
          });
          continue;
        }
        if (password?.length > 128) {
          results.failed.push({
            password,
            reason: 'รหัสผ่านยาวกว่า 128 ตัวอักษร'
          });
          continue;
        }

        // กรณีที่ไม่มีอีเมลในระบบ สร้างบัญชีใหม่
        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(password, salt);

        const newUser = new User({
          name,
          email,
          emailVerified: true,
          password: hashedPassword,
          avatar: null,
          provider: 'local',
          school: requestUser.school,
        });

        await newUser.save();

        results.success.push({
          email,
          name,
          status: 'สร้างบัญชีใหม่สำเร็จ'
        });

      } catch (error) {
        console.error('Error importing user:', error);
        results.failed.push({
          email: userData.email,
          reason: 'เกิดข้อผิดพลาดในการนำเข้าข้อมูล'
        });
      }
    }

    res.json({ results });
  } catch (error) {
    console.error('Error in importUsersFromXlsxController:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการนำเข้าข้อมูล' });
  }
};

/**
 * Revoke user from school (by school admin)
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const revokeUserFromSchoolController = async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    // ตรวจสอบว่าผู้ใช้ที่เรียก API มีสิทธิ์ schoolAdmin
    if (!req.user.schoolAdmin) {
      return res.status(403).json({ message: 'Unauthorized: Only school admin users can revoke school users' });
    }

    // ตรวจสอบว่าผู้ใช้มี school
    if (!req.user.school) {
      return res.status(403).json({ message: 'You are not associated with any school' });
    }

    // ดึงข้อมูลผู้ใช้ที่ต้องการเพิกถอน
    const targetUser = await User.findById(userId);
    
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // ตรวจสอบว่าผู้ใช้ที่ต้องการเพิกถอนอยู่ในโรงเรียนเดียวกันกับ schoolAdmin
    if (targetUser.school !== req.user.school) {
      return res.status(403).json({ message: 'You can only revoke users from your own school' });
    }

    // ป้องกันการเพิกถอนตัวเอง
    if (targetUser._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot revoke yourself from the school' });
    }

    // เก็บค่าเดิมเพื่อส่งกลับให้ frontend
    const wasSchoolAdmin = targetUser.schoolAdmin;

    // ตั้งค่า school เป็น null และตั้งค่า schoolAdmin เป็น false สำหรับผู้ใช้ที่ต้องการเพิกถอน
    targetUser.school = null;
    targetUser.schoolAdmin = false;
    await targetUser.save();

    await deleteAllUserSessions({ userId });

    res.status(200).json({ 
      message: 'User revoked from school successfully',
      user: {
        _id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        wasSchoolAdmin // ส่งข้อมูลว่าผู้ใช้เคยเป็น schoolAdmin หรือไม่
      }
    });
  } catch (error) {
    logger.error('Error revoking user from school:', error);
    res.status(500).json({ message: 'Error revoking user from school' });
  }
};

/**
 * Middleware to check if user is a schoolAdmin and has permission to share prompts to their school
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const checkSchoolPromptShare = async (req, res, next) => {
  try {
    // First check if user has basic prompt permissions
    const { PermissionTypes, Permissions } = require('librechat-data-provider');
    const { generateCheckAccess } = require('~/server/middleware');
    
    const hasAccess = await generateCheckAccess(PermissionTypes.PROMPTS, [
      Permissions.USE,
      Permissions.CREATE,
    ])(req, res, () => true);

    // If user doesn't have basic permissions, the above middleware would have already responded
    if (hasAccess !== true) {
      return;
    }

    // Check if user is schoolAdmin
    if (req.user.schoolAdmin === true && req.user.school) {
      // Allow school admins to share prompts to their school
      if (req.body.schoolShare === true || req.body.removeSchoolShare === true) {
        return next();
      }
    }

    // If we're here, the user is trying to share to school but doesn't have permission
    if (req.body.schoolShare === true || req.body.removeSchoolShare === true) {
      logger.warn(
        `[${PermissionTypes.PROMPTS}] Forbidden: User ${req.user.id} attempted to share to school without schoolAdmin permission`,
      );
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions for school sharing' });
    }

    // If not trying to share to school, proceed to next middleware
    next();
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ message: `Server error: ${error.message}` });
  }
};

/**
 * Updates a prompt group for school sharing
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const patchPromptGroupSchool = async (req, res) => {
  try {
    const { groupId } = req.params;
    const author = req.user.id;
    const filter = { _id: groupId, author };
    
    // Prepare update data
    const updateData = {};
    
    if (req.body.schoolShare === true) {
      updateData.schoolId = req.user.school;
    } else if (req.body.removeSchoolShare === true) {
      updateData.schoolId = null;
    }
    
    const { updatePromptGroup } = require('~/models/Prompt');
    const promptGroup = await updatePromptGroup(filter, updateData);
    res.status(200).send(promptGroup);
  } catch (error) {
    logger.error(error);
    res.status(500).send({ error: 'Error updating prompt group school sharing' });
  }
};

/**
 * Reset password for a user by school admin
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const resetUserPasswordBySchoolAdmin = async (req, res) => {
  try {
    const { userId } = req.params;
    const { password } = req.body;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    if (!password || password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }
    
    // Check if the requesting user is a school admin
    if (!req.user.schoolAdmin) {
      return res.status(403).json({ message: 'You are not authorized to reset passwords' });
    }
    
    // Find the target user
    const targetUser = await User.findById(userId);
    
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if the target user belongs to the same school as the admin
    if (targetUser.school && req.user.school && targetUser.school.toString() !== req.user.school.toString()) {
      return res.status(403).json({ message: 'You can only reset passwords for users in your school' });
    }
    
    // Hash the new password
    const hash = bcrypt.hashSync(password, 10);
    
    // Update the user's password
    targetUser.password = hash;
    await targetUser.save();
    
    // TODO: Delete all user sessions to force them to login again
    // Implementation depends on how sessions are stored in your application
    
    return res.status(200).json({ message: 'Password has been reset successfully' });
  } catch (error) {
    logger.error('Error resetting password:', error);
    return res.status(500).json({ message: 'An error occurred while resetting the password' });
  }
};


module.exports = {
  checkEmailController,
  createUserBySchoolAdminController,
  importUsersFromXlsxController,
  revokeUserFromSchoolController,
  checkSchoolPromptShare,
  patchPromptGroupSchool,
  resetUserPasswordBySchoolAdmin,
};