const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const User = require('../schemas/user');
const { celebrate, Joi, errors, Segments } = require('celebrate');

require('dotenv').config();

const router = express.Router();

// Login (POST /auth/login): Allows users to log in with their credentials (username and password) and receive a JWT token for authentication. User Management Routes
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Signup (POST /auth/signup): Allows you to create an Admin user. There can only be one admin.

router.post(
  '/signup',
  celebrate({
    [Segments.BODY]: Joi.object().keys({
      username: Joi.string().required(),
      email: Joi.string().email().required(),
      password: Joi.string().required(),
      role: Joi.string().valid('Admin'),
    }),
  }),
  async (req, res) => {
    try {
      const { username, email, password, role } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);
      // if (!role) role = 'Admin';
      const role2 = 'Admin';
      // if (!role) role = role2;
      const users = await User.findOne({ where: { role: 'Admin' } });
      if (users) {
        res
          .status(401)
          .json({ error: 'Already have Admin.There can only be one admin.' });
        return;
      }
      await User.create({
        username: username,
        email: email,
        role: role2,
        password: hashedPassword,
      });
      res.status(201).json('User created');
    } catch (error) {
      console.error('Error logging in:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

module.exports = router;
