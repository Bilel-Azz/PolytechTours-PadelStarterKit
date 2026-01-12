const { Sequelize } = require('sequelize');
const path = require('path');

// Configuration flexible : PostgreSQL (Neon) en production, SQLite en développement
let sequelize;

if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres')) {
    // Configuration pour Neon Postgres
    sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false // Nécessaire pour Neon
            }
        },
        logging: false,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    });
} else {
    // Configuration pour SQLite (développement local)
    sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: process.env.DATABASE_URL ? process.env.DATABASE_URL.replace('sqlite:///', '') : path.join(__dirname, '../padel_corpo.db'),
        logging: false
    });
}

module.exports = sequelize;
