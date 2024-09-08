const Role = require('../schemas/role');
const express = require('express');
const router = express.Router();

router.post('/roles', async (req, res) => {
  const { name, permissions } = req.body;

  try {
    // Create a new role
    const role = await Role.create({ name, permissions });
    res.status(201).json(role);
  } catch (error) {
    console.error('Error creating role:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
