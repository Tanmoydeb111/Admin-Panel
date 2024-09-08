const express = require('express');
require('dotenv').config();
const { authenticate } = require('../middleware/auth');
const audit = require('../schemas/auditHis');

require('dotenv').config();

const router = express.Router();

//Get Audit Logs (GET /audit-logs): Accessible by Admin. Retrieves a list of audit logs that track important actions within the system.

router.get('/audit-logs', authenticate, async (req, res) => {
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ error: 'Access denied. Admins only.' });
  }
  try {
    const allAudit = await audit.findAll();
    res.status(201).json(allAudit);
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
