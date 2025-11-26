const sequelize = require('../config/database');
const User = require('./User');
const LoginAttempt = require('./LoginAttempt');

const db = {
    sequelize,
    User,
    LoginAttempt
};

module.exports = db;
