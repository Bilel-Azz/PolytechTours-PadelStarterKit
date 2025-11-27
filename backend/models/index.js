const { Sequelize } = require('sequelize');
const sequelize = require('../config/database');

// Import models
const User = require('./User')(sequelize, Sequelize.DataTypes);
const LoginAttempt = require('./LoginAttempt')(sequelize, Sequelize.DataTypes);
const Player = require('./Player')(sequelize, Sequelize.DataTypes);
const Team = require('./Team')(sequelize, Sequelize.DataTypes);
const Pool = require('./Pool')(sequelize, Sequelize.DataTypes);
const Event = require('./Event')(sequelize, Sequelize.DataTypes);
const Match = require('./Match')(sequelize, Sequelize.DataTypes);

const db = {
    sequelize,
    Sequelize,
    User,
    LoginAttempt,
    Player,
    Team,
    Pool,
    Event,
    Match,
};

// Set up associations
Object.keys(db).forEach((modelName) => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});

module.exports = db;
