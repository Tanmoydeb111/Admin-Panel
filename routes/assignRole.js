const express = require('express');
const Router = express.Router();
const UserScheme = require('../schemas/user');
const { where } = require('sequelize');
const { authenticate } = require('../middleware/auth');
const { celebrate, Joi, errors, Segments } = require('celebrate');

//Assign Role to User (POST /users/:id/assign-role): Allows the Admin to assign a role to a user.
Router.post(
  '/users/:id/assign-role',
  authenticate,
  celebrate({
    [Segments.BODY]: Joi.object().keys({
      role: Joi.string().valid('Admin', 'Manager', 'Employee').required(),
    }),
  }),
  async (req, res) => {
    if (req.user.role !== 'Admin') {
      return res
        .status(403)
        .json({ error: 'Access denied. Admins & Manager only.' });
    }
    try {
      const { role } = req.body;
      const id = req.params.id;
      console.log(id);
      const user = await UserScheme.findOne({ where: { id: id } });
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      user.role = role;
      await user.save();
      res.json({ message: 'User role updated successfully' });
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Revoke Role from User (POST /users/:id/revoke-role): Allows the Admin to revoke a user's role.
Router.post(
  '/users/:id/revoke-role',
  authenticate,
  celebrate({
    [Segments.BODY]: Joi.object().keys({
      role: Joi.string().valid('Admin', 'Manager', 'Employee').required(),
    }),
  }),
  async (req, res) => {
    if (req.user.role !== 'Admin') {
      return res
        .status(403)
        .json({ error: 'Access denied. Admins & Manager only.' });
    }
    try {
      const { role } = req.body;
      const id = req.params.id;
      console.log(id);
      const user = await UserScheme.findOne({ where: { id: id } });
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      user.role = 'Employee';
      await user.save();
      res.json({ message: 'User role updated successfully' });
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Update User (PUT /users/:id): Accessible by Admin. Updates the information of a specific user.
Router.put(
  '/users/:id',
  authenticate,
  celebrate({
    [Segments.BODY]: Joi.object().keys({
      userName: Joi.string(),
      email: Joi.string().email(),
      password: Joi.string(),
    }),
  }),
  async (req, res) => {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Access denied. Admins only.' });
    }
    try {
      const { userName, email, password } = req.body;

      const id = req.params.id;
      console.log(userName);
      const user = await UserScheme.findByPk(id);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      //   console.log(userName);
      //   var usn,pass,emi;
      //   user.userName = userName;
      if (userName) user.username = userName;
      if (email) user.email = email;
      if (password) user.password = password;

      await user.save();
      //   console.log('User updated:', user);
      res.json({ message: 'User information updated successfully' });
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

module.exports = Router;
