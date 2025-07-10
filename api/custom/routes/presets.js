const express = require('express');
const { logger } = require('~/config');

const router = express.Router();

/**
 * @route GET /api/custom/presets/max-context
 * @description Get the maximum context tokens value from environment variable
 * @access Public
 */
router.get('/max-context', function (req, res) {
  try {
    const maxContextTokens = process.env.DEFAULT_MAX_CONTEXT_TOKENS || 4096; // Default value if not set
    return res.status(200).send({ maxContextTokens });
  } catch (err) {
    logger.error('Error in max context tokens config', err);
    return res.status(500).send({ error: err.message });
  }
});

module.exports = router; 