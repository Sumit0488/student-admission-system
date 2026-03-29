const express = require('express');
const router  = express.Router();
const { getAllConfigs, getConfigByType } = require('../controllers/config.controller');

router.get('/',      getAllConfigs);    // GET /api/config          → all types at once
router.get('/:type', getConfigByType); // GET /api/config/program
                                       // GET /api/config/batch
                                       // GET /api/config/status

module.exports = router;
