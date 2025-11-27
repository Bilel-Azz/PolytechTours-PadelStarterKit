// ============================================
// FICHIER : backend/routes/teams.js
// ============================================

const express = require('express');
const router = express.Router();
const { Team, Player } = require('../models');
const { validate } = require('../middleware/validator');
const { asyncHandler, NotFoundError, ValidationError } = require('../middleware/errorHandler');
const {
    successResponse,
    createdResponse,
    paginatedResponse,
    getPaginationParams,
} = require('../utils/response');
const {
    createTeamSchema,
    updateTeamSchema,
    teamIdSchema,
    listTeamsQuerySchema,
} = require('../validators/team.validator');

// List all teams with pagination
router.get(
    '/',
    validate(listTeamsQuerySchema, 'query'),
    asyncHandler(async (req, res) => {
        const { page, limit, offset } = getPaginationParams(req.query);
        const { poolId, company } = req.query;

        const where = {};

        if (poolId) {
            where.poolId = poolId;
        }

        if (company) {
            where.company = company;
        }

        const { count, rows } = await Team.findAndCountAll({
            where,
            limit,
            offset,
            include: [
                {
                    model: Player,
                    as: 'player1',
                    attributes: ['id', 'firstName', 'lastName', 'company', 'licenseNumber'],
                },
                {
                    model: Player,
                    as: 'player2',
                    attributes: ['id', 'firstName', 'lastName', 'company', 'licenseNumber'],
                },
                {
                    model: require('../models').Pool,
                    as: 'pool',
                    attributes: ['id', 'name'],
                },
            ],
            order: [['createdAt', 'DESC']],
        });

        // Format response to match specifications
        const teams = rows.map(team => ({
            id: team.id,
            company: team.company,
            players: [
                {
                    id: team.player1.id,
                    first_name: team.player1.firstName,
                    last_name: team.player1.lastName,
                },
                {
                    id: team.player2.id,
                    first_name: team.player2.firstName,
                    last_name: team.player2.lastName,
                },
            ],
            pool: team.pool ? { id: team.pool.id, name: team.pool.name } : null,
        }));

        return paginatedResponse(
            res,
            teams,
            page,
            limit,
            count,
            'Équipes récupérées avec succès'
        );
    })
);

// Get a single team by ID
router.get(
    '/:id',
    validate(teamIdSchema, 'params'),
    asyncHandler(async (req, res) => {
        const { id } = req.params;

        const team = await Team.findByPk(id, {
            include: [
                {
                    model: Player,
                    as: 'player1',
                },
                {
                    model: Player,
                    as: 'player2',
                },
                {
                    model: require('../models').Pool,
                    as: 'pool',
                },
            ],
        });

        if (!team) {
            throw new NotFoundError('Équipe');
        }

        return successResponse(res, team, 'Équipe récupérée avec succès');
    })
);

// Create a new team
router.post(
    '/',
    validate(createTeamSchema, 'body'),
    asyncHandler(async (req, res) => {
        const { company, player1Id, player2Id, poolId } = req.body;

        // Verify both players exist
        const player1 = await Player.findByPk(player1Id);
        const player2 = await Player.findByPk(player2Id);

        if (!player1 || !player2) {
            throw new NotFoundError('Joueur');
        }

        // Verify both players belong to the same company
        if (player1.company !== company || player2.company !== company) {
            throw new ValidationError('Les deux joueurs doivent appartenir à l\'entreprise spécifiée');
        }

        // Check if players are already in a team (one team per season rule)
        const existingTeam1 = await Team.findOne({
            where: {
                [require('sequelize').Op.or]: [
                    { player1Id: player1Id },
                    { player2Id: player1Id },
                ],
            },
        });

        const existingTeam2 = await Team.findOne({
            where: {
                [require('sequelize').Op.or]: [
                    { player1Id: player2Id },
                    { player2Id: player2Id },
                ],
            },
        });

        if (existingTeam1) {
            throw new ValidationError(`Le joueur ${player1.firstName} ${player1.lastName} est déjà dans une équipe`);
        }

        if (existingTeam2) {
            throw new ValidationError(`Le joueur ${player2.firstName} ${player2.lastName} est déjà dans une équipe`);
        }

        // Create team
        const team = await Team.create({
            company,
            player1Id,
            player2Id,
            poolId,
        });

        // Fetch team with players
        const teamWithPlayers = await Team.findByPk(team.id, {
            include: [
                { model: Player, as: 'player1' },
                { model: Player, as: 'player2' },
            ],
        });

        return createdResponse(res, teamWithPlayers, 'Équipe créée avec succès');
    })
);

// Update a team
router.put(
    '/:id',
    validate(teamIdSchema, 'params'),
    validate(updateTeamSchema, 'body'),
    asyncHandler(async (req, res) => {
        const { id } = req.params;
        const updateData = req.body;

        const team = await Team.findByPk(id, {
            include: [
                { model: require('../models').Match, as: 'matchesAsTeam1' },
                { model: require('../models').Match, as: 'matchesAsTeam2' },
            ],
        });

        if (!team) {
            throw new NotFoundError('Équipe');
        }

        // Check if team has any matches
        const hasMatches = team.matchesAsTeam1?.length > 0 || team.matchesAsTeam2?.length > 0;

        if (hasMatches) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'TEAM_HAS_MATCHES',
                    message: 'L\'équipe ne peut pas être modifiée car elle a déjà joué des matchs',
                },
            });
        }

        await team.update(updateData);

        const teamWithPlayers = await Team.findByPk(team.id, {
            include: [
                { model: Player, as: 'player1' },
                { model: Player, as: 'player2' },
            ],
        });

        return successResponse(res, teamWithPlayers, 'Équipe mise à jour avec succès');
    })
);

// Delete a team
router.delete(
    '/:id',
    validate(teamIdSchema, 'params'),
    asyncHandler(async (req, res) => {
        const { id } = req.params;

        const team = await Team.findByPk(id, {
            include: [
                { model: require('../models').Match, as: 'matchesAsTeam1' },
                { model: require('../models').Match, as: 'matchesAsTeam2' },
            ],
        });

        if (!team) {
            throw new NotFoundError('Équipe');
        }

        // Check if team has any matches
        const hasMatches = team.matchesAsTeam1?.length > 0 || team.matchesAsTeam2?.length > 0;

        if (hasMatches) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'TEAM_HAS_MATCHES',
                    message: 'L\'équipe ne peut pas être supprimée car elle a déjà joué des matchs',
                },
            });
        }

        await team.destroy();

        return successResponse(res, null, 'Équipe supprimée avec succès');
    })
);

module.exports = router;
