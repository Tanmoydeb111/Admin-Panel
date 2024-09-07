const express = require('express');
require('dotenv').config();
const sequelize = require('./config/database'); // Sequelize instance

const userRoutes = require('./routes/register');
const roleRoutes = require('./routes/role');
const authRoutes = require('./routes/authRoutes');
const getAllUser = require('./routes/getAllUsers');
const assignRole = require('./routes/assignRole');
const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;

app.use('/', userRoutes);
app.use('/', roleRoutes);
app.use('/auth', authRoutes);
app.use('/', getAllUser);
app.use('/', assignRole);
// Sync Sequelize models with database
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
