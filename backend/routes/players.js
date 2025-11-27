// ============================================
// FICHIER : backend/routes/players.js
// ============================================

const express = require('express');
const router = express.Router();
const { Player, User } = require('../models');
const { validate } = require('../middleware/validator');
const { asyncHandler, NotFoundError } = require('../middleware/errorHandler');
const {
    successResponse,
    createdResponse,
    paginatedResponse,
    getPaginationParams,
} = require('../utils/response');
const {
    createPlayerSchema,
    updatePlayerSchema,
    playerIdSchema,
    listPlayersQuerySchema,
} = require('../validators/player.validator');
const { Op } = require('sequelize');

// List all players with pagination and filters
router.get(
    '/',
    validate(listPlayersQuerySchema, 'query'),
    asyncHandler(async (req, res) => {
        const { page, limit, offset } = getPaginationParams(req.query);
        const { company, search } = req.query;

        const where = {};

        // Apply filters
        if (company) {
            where.company = company;
        }

        if (search) {
            where[Op.or] = [
                { firstName: { [Op.like]: `%${search}%` } },
                { lastName: { [Op.like]: `%${search}%` } },
                { company: { [Op.like]: `%${search}%` } },
                { licenseNumber: { [Op.like]: `%${search}%` } },
            ];
        }

        const { count, rows } = await Player.findAndCountAll({
            where,
            limit,
            offset,
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'email', 'role'],
                },
            ],
            order: [['createdAt', 'DESC']],
        });

        // Add has_account flag
        const players = rows.map(player => ({
            ...player.toJSON(),
            has_account: !!player.userId,
        }));

        return paginatedResponse(
            res,
            players,
            page,
            limit,
            count,
            'Joueurs récupérés avec succès'
        );
    })
);

// Get a single player by ID
router.get(
    '/:id',
    validate(playerIdSchema, 'params'),
    asyncHandler(async (req, res) => {
        const { id } = req.params;

        const player = await Player.findByPk(id, {
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'email', 'role'],
                },
            ],
        });

        if (!player) {
            throw new NotFoundError('Joueur');
        }

        const playerData = {
            ...player.toJSON(),
            has_account: !!player.userId,
        };

        return successResponse(res, playerData, 'Joueur récupéré avec succès');
    })
);

// Create a new player
router.post(
    '/',
    validate(createPlayerSchema, 'body'),
    asyncHandler(async (req, res) => {
        const playerData = req.body;

        // If email is provided, create a user account
        let userId = null;
        if (playerData.email) {
            // This will be handled by admin/accounts/create endpoint
            // For now, just create the player without account
            delete playerData.email;
        }

        const player = await Player.create(playerData);

        return createdResponse(res, player, 'Joueur créé avec succès');
    })
);

// Update a player
router.put(
    '/:id',
    validate(playerIdSchema, 'params'),
    validate(updatePlayerSchema, 'body'),
    asyncHandler(async (req, res) => {
        const { id } = req.params;
        const updateData = req.body;

        const player = await Player.findByPk(id);

        if (!player) {
            throw new NotFoundError('Joueur');
        }

        await player.update(updateData);

        return successResponse(res, player, 'Joueur mis à jour avec succès');
    })
);

// Delete a player
router.delete(
    '/:id',
    validate(playerIdSchema, 'params'),
    asyncHandler(async (req, res) => {
        const { id } = req.params;

        const player = await Player.findByPk(id, {
            include: [
                { model: require('../models').Team, as: 'teamsAsPlayer1' },
                { model: require('../models').Team, as: 'teamsAsPlayer2' },
            ],
        });

        if (!player) {
            throw new NotFoundError('Joueur');
        }

        // Check if player is in any active team
        if (player.teamsAsPlayer1?.length > 0 || player.teamsAsPlayer2?.length > 0) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'PLAYER_IN_TEAM',
                    message: 'Le joueur ne peut pas être supprimé car il appartient à une équipe',
                },
            });
        }

        await player.destroy();

        return successResponse(res, null, 'Joueur supprimé avec succès');
    })
);

module.exports = router;
