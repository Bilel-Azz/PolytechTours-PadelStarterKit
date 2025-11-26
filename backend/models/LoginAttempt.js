const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LoginAttempt = sequelize.define('LoginAttempt', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false
    },
    attempts_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    last_attempt: {
        type: DataTypes.DATE
    },
    locked_until: {
        type: DataTypes.DATE
    }
}, {
    tableName: 'login_attempts',
    timestamps: false
});

module.exports = LoginAttempt;
