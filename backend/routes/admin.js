// ============================================
// FICHIER : backend/routes/admin.js
// ============================================

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { User, Player } = require('../models');
const { asyncHandler, NotFoundError, ValidationError } = require('../middleware/errorHandler');
const { successResponse, createdResponse } = require('../utils/response');

// Generate a random secure password
function generateTemporaryPassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    const length = 16;
    let password = '';

    // Ensure at least one of each type
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
    password += '0123456789'[Math.floor(Math.random() * 10)];
    password += '!@#$%^&*'[Math.floor(Math.random() * 8)];

    // Fill the rest
    for (let i = 4; i < length; i++) {
        password += chars[Math.floor(Math.random() * chars.length)];
    }

    // Shuffle
    return password.split('').sort(() => Math.random() - 0.5).join('');
}

// Create account for a player
router.post(
    '/accounts/create',
    asyncHandler(async (req, res) => {
        // TODO: Add admin auth middleware
        const { playerId, role } = req.body;

        // Verify player exists
        const player = await Player.findByPk(playerId);
        if (!player) {
            throw new NotFoundError('Joueur');
        }

        // Check if player already has an account
        if (player.userId) {
            throw new ValidationError('Ce joueur a déjà un compte');
        }

        // Generate temporary password
        const temporaryPassword = generateTemporaryPassword();
        const passwordHash = await bcrypt.hash(temporaryPassword, 10);

        // Create user account
        const user = await User.create({
            email: `${player.firstName.toLowerCase()}.${player.lastName.toLowerCase()}@example.com`,
            password_hash: passwordHash,
            role: role || 'JOUEUR',
            is_active: true,
            must_change_password: true,
        });

        // Link player to user
        await player.update({ userId: user.id });

        return createdResponse(
            res,
            {
                message: 'Compte créé avec succès',
                email: user.email,
                temporary_password: temporaryPassword,
                warning: 'Ce mot de passe ne sera affiché qu\'une seule fois',
            },
            'Compte créé avec succès'
        );
    })
);

// Reset user password
router.post(
    '/accounts/:userId/reset-password',
    asyncHandler(async (req, res) => {
        // TODO: Add admin auth middleware
        const { userId } = req.params;

        const user = await User.findByPk(userId);
        if (!user) {
            throw new NotFoundError('Utilisateur');
        }

        // Generate new temporary password
        const temporaryPassword = generateTemporaryPassword();
        const passwordHash = await bcrypt.hash(temporaryPassword, 10);

        // Update user
        await user.update({
            password_hash: passwordHash,
            must_change_password: true,
        });

        return successResponse(
            res,
            {
                message: 'Mot de passe réinitialisé',
                temporary_password: temporaryPassword,
                warning: 'Ce mot de passe ne sera affiché qu\'une seule fois',
            },
            'Mot de passe réinitialisé avec succès'
        );
    })
);

module.exports = router;
