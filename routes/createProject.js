const express = require('express');
const router = express.Router();
const project = require('../schemas/project');
const projectBackup = require('../schemas/projectBackup');
const audit = require('../schemas/auditHis');
const { authenticate } = require('../middleware/auth');
const { celebrate, Joi, errors, Segments } = require('celebrate');
const { Op } = require('sequelize');

//Create Project (POST /project): Accessible by Admin. Creates a new project that users can be assigned to.
router.post(
  '/project',
  authenticate,
  celebrate({
    [Segments.BODY]: Joi.object().keys({
      projectName: Joi.string().required().min(3).max(50),
      description: Joi.string().required().min(5).max(500),
      createdBy: Joi.string().required(),
      assignedTo: Joi.array().items(Joi.string()).required(),
    }),
  }),
  async (req, res) => {
    const { projectName, description, createdBy, assignedTo, deletedAt } =
      req.body;
    console.log(req.user.role);
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Access denied. Admins only.' });
    }

    try {
      const pro = await project.create({
        projectName,
        description,
        createdBy,
        assignedTo,
        deletedAt,
      });
      const action = `Create Project - ${projectName}`;
      const performedBy = 'defe74dd-f017-4a18-8e30-5f53ac7f6468';
      await audit.create({ action: action, performedBy: performedBy });
      res.json(pro);
    } catch (error) {
      console.error('Error creating project:', error);
      res.json({ error: 'Internal server error' });
    }
  }
);

//   Get Project by ID (GET /project/:id): Accessible by all users. Retrieves the details of a specific project.
router.get('/project/:id', authenticate, async (req, res) => {
  const id = req.params.id;

  //   if (req.user.role !== 'Admin') {
  //     return res.status(403).json({ error: 'Access denied. Admins only.' });
  //   }

  try {
    const pro = await project.findOne({
      where: { id: id },

      attributes: ['id', 'projectName', 'description'],
    });
    res.json(pro);
  } catch (error) {
    console.error('Error creating user:', error);
    res.json({ error: 'Internal server error' });
  }
});

//Get Projects (GET /project): Accessible by all users. Retrieves a list of projects available to the user based on their role.
//Accessible by all users. Retrieves a list of projects available to the user based on their role.
router.get('/project', authenticate, async (req, res) => {
  const id = req.user.userId;
  //   console.log(id);
  try {
    const projects = await project.findAll({
      where: {
        assignedTo: {
          [Op.contains]: [id], // Check if userId is in the assignedTo array
        },
      },
    });
    const projectDetails = projects.map((proj) => ({
      id: proj.id,
      projectName: proj.projectName,
      description: proj.description,
    }));

    res.json(projectDetails);

    // res.status(201).json('user deleted');
  } catch (error) {
    console.error('Error fetching users:', error);
  }
});

module.exports = router;

//Update Project (PUT /project/:id): Accessible by Admin. Updates the details of a project.
router.put(
  '/project/:id',
  authenticate,
  celebrate({
    [Segments.BODY]: Joi.object().keys({
      description: Joi.string().required().min(5).max(500),
    }),
  }),
  async (req, res) => {
    if (req.user.role == 'Employee') {
      return res
        .status(403)
        .json({ error: 'Access denied. Admins & Manager only.' });
    }
    try {
      const id = req.params.id;
      const { description } = req.body;
      console.log(description);
      const pro = await project.findByPk(id);
      pro.description = description;
      await pro.save();

      const action = `Change Project description- ${description}`;
      const performedBy = 'defe74dd-f017-4a18-8e30-5f53ac7f6468';
      await audit.create({ action: action, performedBy: performedBy });

      res.json({ message: 'description updated successfully' });
    } catch (error) {
      console.error('Error creating user:', error);
      res.json({ error: 'Internal server error' });
    }
  }
);

// Delete Project (DELETE /project/:id): Accessible by Admin. Soft deletes a project.
router.delete(
  '/project/:id',
  authenticate,
  celebrate({
    [Segments.BODY]: Joi.object().keys({
      projectName: Joi.string().required().min(3).max(50),
      description: Joi.string().required().min(5).max(500),
      createdBy: Joi.string().required(),
      assignedTo: Joi.array().items(Joi.string()).required(),
    }),
  }),
  async (req, res) => {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Access denied. Admins only.' });
    }
    try {
      const id = req.params.id;
      const users = await project.findByPk(id);
      const { projectName, description, createdBy, assignedTo } = users;

      const deletedAt = new Date();
      const userB = await projectBackup.create({
        id,
        projectName,
        description,
        createdBy,
        assignedTo,
        deletedAt,
      });

      const action = `Soft Delete Project - ${projectName}`;
      const performedBy = 'defe74dd-f017-4a18-8e30-5f53ac7f6468';
      await audit.create({ action: action, performedBy: performedBy });

      await users.destroy();

      res.status(201).json(userB);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }
);

// Permanant Delete User (DELETE /project/permanent/:id): Accessible by Admin, Permanently Deletes a project. (OPTIONAL)
router.delete(
  '/project/permanent/:id',
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
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Access denied. Admins only.' });
    }
    try {
      const id = req.params.id;
      const users = await project.findByPk(id);
      const usersB = await projectBackup.findByPk(id);
      if (users) {
        const action = `Parmanent delete Project - ${users.projectName}`;
        const performedBy = 'defe74dd-f017-4a18-8e30-5f53ac7f6468';
        await audit.create({ action: action, performedBy: performedBy });
        await users.destroy();
      } else if (usersB) {
        const action = `Parmanent delete Project - ${usersB.projectName}`;
        const performedBy = 'defe74dd-f017-4a18-8e30-5f53ac7f6468';
        await audit.create({ action: action, performedBy: performedBy });
        await usersB.destroy();
      } else res.json('user not found');

      res.status(201).json('user deleted');
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }
);
//Restore Project (PATCH /project/restore/:id): Accessible by Admin. Restores a soft-deleted project.
router.patch('/project/restore/:id', async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Access denied. Admins only.' });
    }
    const id = req.params.id;
    const usersB = await projectBackup.findByPk(id);
    const { projectName, description, createdBy, assignedTo, deletedAt } =
      usersB;
    const users = await project.create({
      id,
      projectName,
      description,
      createdBy,
      assignedTo,
      deletedAt,
    });
    if (usersB) await usersB.destroy();
    else res.json('user not found');

    const action = `Restore Project - ${users.projectName}`;
    const performedBy = 'defe74dd-f017-4a18-8e30-5f53ac7f6468';
    await audit.create({ action: action, performedBy: performedBy });
    res.json('user restored');

    // res.status(201).json('user deleted');
  } catch (error) {
    console.error('Error fetching users:', error);
  }
});
