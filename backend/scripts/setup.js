#!/usr/bin/env node
// ============================================
// FICHIER : backend/scripts/setup.js
// Script d'initialisation de la base de données
// Crée les tables et insère les données de test
// ============================================

const { sequelize } = require('../models');

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    bold: '\x1b[1m',
};

function log(message, type = 'info') {
    const color = type === 'success' ? colors.green
        : type === 'error' ? colors.red
            : type === 'warning' ? colors.yellow
                : type === 'header' ? colors.blue + colors.bold
                    : colors.reset;
    console.log(`${color}${message}${colors.reset}`);
}

async function setup() {
    console.log('\n');
    log('╔══════════════════════════════════════════════════════════╗', 'header');
    log('║       PADEL CORPO - INITIALISATION BASE DE DONNEES       ║', 'header');
    log('╚══════════════════════════════════════════════════════════╝', 'header');
    console.log('\n');

    try {
        // Test database connection
        log('🔌 Connexion à la base de données...', 'info');
        await sequelize.authenticate();
        log('✅ Connexion établie', 'success');

        // Create tables
        log('\n🔧 Création des tables...', 'info');
        await sequelize.sync({ force: true });
        log('✅ Tables créées avec succès', 'success');

        console.log('\n');
        log('╔══════════════════════════════════════════════════════════╗', 'header');
        log('║              ✅ INITIALISATION TERMINEE                  ║', 'header');
        log('╚══════════════════════════════════════════════════════════╝', 'header');
        console.log('\n');

        log('📝 Prochaine étape:', 'info');
        log('   npm run seed    # Pour insérer les données de test', 'warning');
        console.log('\n');

    } catch (error) {
        log(`\n❌ Erreur: ${error.message}`, 'error');
        console.error(error);
        process.exit(1);
    } finally {
        await sequelize.close();
    }
}

setup();
