const express = require('express');
const { savePromptHistory, getRecentPrompts } = require('~/custom/controllers/promptHistory');
const { requireJwtAuth } = require('~/server/middleware');

const router = express.Router();

// ดึงประวัติการใช้งาน prompt ล่าสุด
router.get('/recent', requireJwtAuth, getRecentPrompts);

// บันทึกประวัติการใช้งาน prompt
router.post('/history', requireJwtAuth, savePromptHistory);

module.exports = router;