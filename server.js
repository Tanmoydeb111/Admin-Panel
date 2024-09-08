const express = require('express');
require('dotenv').config();
const sequelize = require('./config/database');
const { errors } = require('celebrate');
const userRoutes = require('./routes/register');
const roleRoutes = require('./routes/role');
const authRoutes = require('./routes/authRoutes');
const getAllUser = require('./routes/getAllUsers');
const assignRole = require('./routes/assignRole');

const createProject = require('./routes/createProject');
const allAudit = require('./routes/auditacc');
const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;

app.use(
  '/',
  userRoutes,
  roleRoutes,
  getAllUser,
  assignRole,
  createProject,
  allAudit
);

app.use('/auth', authRoutes);

app.use(errors());

// Fallback error handling middleware for other errors
app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.json({
    error: {
      message: err.message,
    },
  });
});

sequelize
  .sync()
  .then(() => {
    console.log('Database & tables created!');
  })
  .catch((err) => {
    console.error('Unable to sync database:', err);
  });

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
