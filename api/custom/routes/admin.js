const express = require('express');
const { requireJwtAuth, checkAdmin } = require('~/server/middleware');
const { adminImpersonateController } = require('~/custom/controllers/admin');

const router = express.Router();

// Admin routes
router.use(requireJwtAuth);
router.use(checkAdmin);

// Admin impersonation route
router.post('/impersonate', adminImpersonateController);

module.exports = router; 