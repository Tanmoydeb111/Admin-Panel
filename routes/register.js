const bcrypt = require('bcrypt');
const User = require('../schemas/user');
const express = require('express');
const router = express.Router();
const audit = require('../schemas/auditHis');
const { celebrate, Joi, errors, Segments } = require('celebrate');
const { authenticate } = require('../middleware/auth');

//Register User (POST /auth/register): Allows the Admin to register new users. (Only Admin can access this route.)
router.post(
  '/users',
  authenticate,
  celebrate({
    [Segments.BODY]: Joi.object().keys({
      username: Joi.string().required(),
      email: Joi.string().email().required(),
      password: Joi.string().required(),
      role: Joi.string().valid('Manager', 'Employee').required(),
    }),
  }),
  async (req, res) => {
    const { username, email, password, role } = req.body;
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Access denied. Admins only.' });
    }
    if (await User.findOne({ where: { email: email } })) {
      return res.status(403).json({ message: 'Email ready exist' });
    }
    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await User.create({
        username,
        email,
        password: hashedPassword,
        role,
      });

      const action = `Create a user - ${user.username}, ${user.id}`;
      const performedBy = 'defe74dd-f017-4a18-8e30-5f53ac7f6468';
      await audit.create({ action: action, performedBy: performedBy });

      res.status(201).json(user);
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);
module.exports = router;
