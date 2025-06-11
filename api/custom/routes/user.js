const express = require('express');
const { requireJwtAuth, checkAdmin } = require('~/server/middleware');
const { checkUsagePermissionController } = require('~/server/controllers/UserController');
const {
  getUserCountBySchoolController,
  getSchoolsWithoutAdminController,
  getUsersWithoutSchoolController,
  getSchoolsWithAdminController,
  getUsersBySchoolController,
  updateUserSchoolAdminController,
  updateUsersSchoolController,
  getUsersRegisteredTodayController,
  assignAdminRoleController,
  assignUserRoleController,
  searchUsersController,
  getUserBalanceController,
  updateUserSuperCreditController,
} = require('~/custom/controllers/admin');
const {
  checkEmailController,
  createUserBySchoolAdminController,
  importUsersFromXlsxController,
  revokeUserFromSchoolController,
  resetUserPasswordBySchoolAdmin,
} = require('~/custom/controllers/schooladmin');

const router = express.Router();

// permission
router.get('/usage-permission', requireJwtAuth, checkUsagePermissionController);

// Admin dashboard routes
router.get('/admin/count-by-school', requireJwtAuth, getUserCountBySchoolController);
router.get('/admin/schools-without-admin', requireJwtAuth, getSchoolsWithoutAdminController);
router.get('/admin/users-without-school', requireJwtAuth, getUsersWithoutSchoolController);
router.get('/admin/schools-with-admin', requireJwtAuth, getSchoolsWithAdminController);
router.get('/admin/users/school/:schoolId', requireJwtAuth, getUsersBySchoolController);
router.get('/admin/users-registered-today', requireJwtAuth, getUsersRegisteredTodayController);
router.put('/admin/users/:userId/school-admin', requireJwtAuth, updateUserSchoolAdminController);
router.post('/admin/users/update-school', requireJwtAuth, updateUsersSchoolController);
router.put('/admin/users/make-admin', requireJwtAuth, checkAdmin, assignAdminRoleController);
router.put('/admin/users/make-user', requireJwtAuth, checkAdmin, assignUserRoleController);
router.get('/search', requireJwtAuth, checkAdmin, searchUsersController);
router.get('/:userId/balance', requireJwtAuth, checkAdmin, getUserBalanceController);
router.put('/admin/users/super-credit', requireJwtAuth, checkAdmin, updateUserSuperCreditController);

// School Admin routes
router.post('/school-admin/check-email', requireJwtAuth, checkEmailController);
router.post('/school-admin/create-user', requireJwtAuth, createUserBySchoolAdminController);
router.post('/school-admin/import-users', requireJwtAuth, importUsersFromXlsxController);
router.post('/school-admin/revoke-user', requireJwtAuth, revokeUserFromSchoolController);
router.put('/school-admin/users/:userId/reset-password', requireJwtAuth, resetUserPasswordBySchoolAdmin);

module.exports = router; 