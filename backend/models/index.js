const sequelize = require('../config/database');
const User = require('./User');
const LoginAttempt = require('./LoginAttempt');
const IpAttempt = require('./IpAttempt');

const db = {
    sequelize,
    User,
    LoginAttempt,
    IpAttempt
};

module.exports = db;
