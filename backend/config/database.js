const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: process.env.DATABASE_URL ? process.env.DATABASE_URL.replace('sqlite:///', '') : path.join(__dirname, '../padel_corpo.db'),
    logging: false
});

module.exports = sequelize;
