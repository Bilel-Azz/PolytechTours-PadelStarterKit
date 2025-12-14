// ============================================
// FICHIER : backend/scripts/createAdmin.js
// Script pour créer un compte administrateur
// Usage: node scripts/createAdmin.js <email> <password>
// ============================================

const bcrypt = require('bcryptjs');
const { sequelize, User } = require('../models');

async function createAdmin(email, password) {
    try {
        // Connexion à la base de données
        await sequelize.authenticate();
        console.log('Connexion à la base de données établie.');

        // Synchroniser les modèles
        await sequelize.sync();

        // Vérifier si l'email existe déjà
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            console.error(`Erreur: Un utilisateur avec l'email "${email}" existe déjà.`);
            process.exit(1);
        }

        // Valider le mot de passe
        if (!password || password.length < 8) {
            console.error('Erreur: Le mot de passe doit contenir au moins 8 caractères.');
            process.exit(1);
        }

        // Hasher le mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);

        // Créer l'administrateur
        const admin = await User.create({
            email,
            password_hash: hashedPassword,
            role: 'ADMINISTRATEUR',
            is_active: true,
            must_change_password: false
        });

        console.log('');
        console.log('='.repeat(50));
        console.log('Administrateur créé avec succès !');
        console.log('='.repeat(50));
        console.log(`Email: ${admin.email}`);
        console.log(`Rôle: ${admin.role}`);
        console.log(`ID: ${admin.id}`);
        console.log('='.repeat(50));
        console.log('');

        process.exit(0);
    } catch (error) {
        console.error('Erreur lors de la création de l\'administrateur:', error.message);
        process.exit(1);
    }
}

// Récupérer les arguments de la ligne de commande
const args = process.argv.slice(2);

if (args.length < 2) {
    console.log('');
    console.log('Usage: node scripts/createAdmin.js <email> <password>');
    console.log('');
    console.log('Exemple:');
    console.log('  node scripts/createAdmin.js admin@corpopadel.fr MonMotDePasse123');
    console.log('');
    process.exit(1);
}

const [email, password] = args;

// Valider l'email
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
    console.error('Erreur: Format d\'email invalide.');
    process.exit(1);
}

createAdmin(email, password);
