const express = require('express');
const Router = express.Router();
const user = require('../schemas/user');
const UserBackup = require('../schemas/userBackup');
const audit = require('../schemas/auditHis');
const project = require('../schemas/project');
const { Op } = require('sequelize');
const { authenticate } = require('../middleware/auth');
const { celebrate, Joi, errors, Segments } = require('celebrate');

// Get Users (GET /users): Accessible by Admin and Manager. Retrieves a list of all users.
// Get User by ID (GET /users/:id): Accessible by all users. Retrieves the details of a specific user.
Router.get(
  '/users/:id?',
  authenticate,
  celebrate({
    [Segments.BODY]: Joi.object().keys({
      role: Joi.string().valid('Manager', 'Employee'),
      username: Joi.string(),
      email: Joi.string().email(),
      password: Joi.string(),
    }),
  }),
  async (req, res) => {
    try {
      const id = req.params.id;

      if (id) {
        const users = await user.findOne({
          where: { id },

          attributes: ['username', 'id', 'email'],
        });
        res.json(users);
      } else {
        // console.log(req.user.role);
        if (req.user.role == 'Employee') {
          return res
            .status(403)
            .json({ error: 'Access denied. Admins & Manager only.' });
        }
        const users = await user.findAll({
          attributes: ['id', 'username', 'email', 'role'],
        });
        // res.json(users.username);

        const userData = users.map((user) => ({
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        }));

        res.json(userData);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }
);

// Delete User (DELETE /users/:id): Accessible by Admin, Soft Deletes a user.
Router.delete('/users/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'Admin') {
    return res
      .status(403)
      .json({ error: 'Access denied. Admins & Manager only.' });
  }
  try {
    const id = req.params.id;
    const users = await user.findByPk(id);
    const { username, email, password, role } = users;

    const userB = await UserBackup.create({
      id,
      username,
      email,
      password,
      role,
    });

    const action = `Soft delete a user - ${userB.username},${userB.id}`;
    const performedBy = 'defe74dd-f017-4a18-8e30-5f53ac7f6468';
    await audit.create({ action: action, performedBy: performedBy });

    await users.destroy();

    res.status(201).json(userB);
  } catch (error) {
    console.error('Error fetching users:', error);
  }
});

// Permanant Delete User (DELETE /users/permanent/:id): Accessible by Admin, Permanently Deletes a user. (OPTIONAL)
Router.delete('/users/permanent/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'Admin') {
    return res
      .status(403)
      .json({ error: 'Access denied. Admins & Manager only.' });
  }
  try {
    const id = req.params.id;
    const users = await user.findByPk(id);
    const usersB = await UserBackup.findByPk(id);
    if (users) {
      const action = `Parmanent delete a user - ${users.username},${users.id}`;
      const performedBy = 'defe74dd-f017-4a18-8e30-5f53ac7f6468';
      await audit.create({ action: action, performedBy: performedBy });
      await users.destroy();
    } else if (usersB) {
      const action = `Parmanent delete a user - ${usersB.username},${usersB.id}`;
      const performedBy = 'defe74dd-f017-4a18-8e30-5f53ac7f6468';
      await audit.create({ action: action, performedBy: performedBy });
      await usersB.destroy();
    } else res.json('user not found');

    res.status(201).json('user deleted');
  } catch (error) {
    console.error('Error fetching users:', error);
  }
});

//Restore User (PATCH /users/restore/:id): Accessible by Admin, Restores a soft-deleted user.
Router.patch('/users/restore/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'Admin') {
    return res
      .status(403)
      .json({ error: 'Access denied. Admins & Manager only.' });
  }
  try {
    const id = req.params.id;
    const usersB = await UserBackup.findByPk(id);
    const { username, email, password, role } = usersB;
    const users = await user.create({
      id,
      username,
      email,
      password,
      role,
    });
    if (usersB) await usersB.destroy();
    else res.json('user not found');

    const action = `Restore a user - ${users.username},${users.id}`;
    const performedBy = 'defe74dd-f017-4a18-8e30-5f53ac7f6468';
    await audit.create({ action: action, performedBy: performedBy });

    res.json('user restored');

    // res.status(201).json('user deleted');
  } catch (error) {
    console.error('Error fetching users:', error);
  }
});

// Router.put('/users/:id', async (req, res) => {
//   try {
//     const id = req.params.id;
//     const projects = await project.findAll({
//       where: {
//         assignedTo: {
//           [Op.contains]: [id], // Check if userId is in the assignedTo array
//         },
//       },
//     });
//     const projectDetails = projects.map((proj) => ({
//       id: proj.id,
//       projectName: proj.projectName,
//       description: proj.description,
//     }));

//     res.json(projectDetails);

//     // res.status(201).json('user deleted');
//   } catch (error) {
//     console.error('Error fetching users:', error);
//   }
// });

module.exports = Router;
