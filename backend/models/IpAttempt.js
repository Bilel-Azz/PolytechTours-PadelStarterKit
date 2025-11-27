const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const IpAttempt = sequelize.define('IpAttempt', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  ip: { type: DataTypes.STRING, allowNull: false, unique: true },

  attempts_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  last_attempt: { type: DataTypes.DATE },
  locked_until: { type: DataTypes.DATE }
}, {
  tableName: 'ip_attempts',
  timestamps: false
});

module.exports = IpAttempt;