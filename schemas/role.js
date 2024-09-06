const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Ensure correct path to sequelize instance

const Role = sequelize.define(
  'Role',
  {
    name: {
      type: DataTypes.ENUM('Admin', 'Manager', 'Employee'),
      allowNull: false,
    },
    permissions: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'Roles',
    timestamps: true,
  }
);

module.exports = Role;
