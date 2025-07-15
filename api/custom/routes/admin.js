const express = require('express');
const { requireJwtAuth, checkAdmin } = require('~/server/middleware');
const { adminImpersonateController, endImpersonateController } = require('~/custom/controllers/admin');
const { logoutController } = require('~/server/controllers/auth/LogoutController');

const router = express.Router();

// Admin routes
router.use(requireJwtAuth);

// Admin impersonation route
router.post('/impersonate', checkAdmin, adminImpersonateController);
router.post('/end-impersonate', endImpersonateController, logoutController);

module.exports = router; 