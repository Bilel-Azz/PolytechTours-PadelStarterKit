// ============================================
// FICHIER : backend/routes/admin.js
// ============================================

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { User, Player, LoginAttempt } = require('../models');
const { asyncHandler, NotFoundError, ValidationError } = require('../middleware/errorHandler');
const { successResponse, createdResponse, paginatedResponse, getPaginationParams } = require('../utils/response');

// GET all users
router.get(
    '/users',
    asyncHandler(async (req, res) => {
        const { page, limit, offset } = getPaginationParams(req.query);
        const { role, is_active } = req.query;

        const where = {};
        if (role) where.role = role;
        if (is_active !== undefined) where.is_active = is_active === 'true';

        const { count, rows } = await User.findAndCountAll({
            where,
            limit,
            offset,
            attributes: ['id', 'email', 'role', 'is_active', 'must_change_password', 'created_at', 'updated_at'],
            order: [['created_at', 'DESC']],
        });

        return paginatedResponse(res, rows, page, limit, count, 'Utilisateurs récupérés avec succès');
    })
);

// GET single user
router.get(
    '/users/:id',
    asyncHandler(async (req, res) => {
        const user = await User.findByPk(req.params.id, {
            attributes: ['id', 'email', 'role', 'is_active', 'must_change_password', 'created_at', 'updated_at'],
        });

        if (!user) {
            throw new NotFoundError('Utilisateur');
        }

        // Get login attempts for this user
        const loginAttempts = await LoginAttempt.findOne({ where: { email: user.email } });

        return successResponse(res, {
            ...user.toJSON(),
            loginAttempts: loginAttempts ? {
                attempts_count: loginAttempts.attempts_count,
                locked_until: loginAttempts.locked_until,
                last_attempt: loginAttempts.last_attempt
            } : null
        }, 'Utilisateur récupéré avec succès');
    })
);

// CREATE user
router.post(
    '/users',
    asyncHandler(async (req, res) => {
        const { email, password, role, is_active } = req.body;

        if (!email || !password) {
            throw new ValidationError('Email et mot de passe requis');
        }

        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            throw new ValidationError('Cet email est déjà utilisé');
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const user = await User.create({
            email,
            password_hash: passwordHash,
            role: role || 'JOUEUR',
            is_active: is_active !== false,
            must_change_password: true,
        });

        return createdResponse(res, {
            id: user.id,
            email: user.email,
            role: user.role,
            is_active: user.is_active,
        }, 'Utilisateur créé avec succès');
    })
);

// UPDATE user
router.put(
    '/users/:id',
    asyncHandler(async (req, res) => {
        const user = await User.findByPk(req.params.id);

        if (!user) {
            throw new NotFoundError('Utilisateur');
        }

        const { email, role, is_active } = req.body;

        if (email && email !== user.email) {
            const existingUser = await User.findOne({ where: { email } });
            if (existingUser) {
                throw new ValidationError('Cet email est déjà utilisé');
            }
            user.email = email;
        }

        if (role) user.role = role;
        if (is_active !== undefined) user.is_active = is_active;

        await user.save();

        return successResponse(res, {
            id: user.id,
            email: user.email,
            role: user.role,
            is_active: user.is_active,
        }, 'Utilisateur mis à jour avec succès');
    })
);

// DELETE user
router.delete(
    '/users/:id',
    asyncHandler(async (req, res) => {
        const user = await User.findByPk(req.params.id);

        if (!user) {
            throw new NotFoundError('Utilisateur');
        }

        // Delete related login attempts
        await LoginAttempt.destroy({ where: { email: user.email } });

        await user.destroy();

        return successResponse(res, null, 'Utilisateur supprimé avec succès');
    })
);

// Unlock user account
router.post(
    '/users/:id/unlock',
    asyncHandler(async (req, res) => {
        const user = await User.findByPk(req.params.id);

        if (!user) {
            throw new NotFoundError('Utilisateur');
        }

        // Reset login attempts
        await LoginAttempt.destroy({ where: { email: user.email } });

        return successResponse(res, null, 'Compte déverrouillé avec succès');
    })
);

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
