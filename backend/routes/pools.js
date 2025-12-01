// ============================================
// FICHIER : backend/routes/pools.js
// ============================================

const express = require('express');
const router = express.Router();
const { Pool, Team, Player } = require('../models');
const { validate } = require('../middleware/validator');
const { asyncHandler, NotFoundError, ValidationError } = require('../middleware/errorHandler');
const {
    successResponse,
    createdResponse,
    paginatedResponse,
    getPaginationParams,
} = require('../utils/response');
const {
    createPoolSchema,
    updatePoolSchema,
    poolIdSchema,
    listPoolsQuerySchema,
} = require('../validators/pool.validator');

// List all pools with pagination
router.get(
    '/',
    validate(listPoolsQuerySchema, 'query'),
    asyncHandler(async (req, res) => {
        const { page, limit, offset } = getPaginationParams(req.query);

        const { count, rows } = await Pool.findAndCountAll({
            limit,
            offset,
            include: [
                {
                    model: Team,
                    as: 'teams',
                    include: [
                        {
                            model: Player,
                            as: 'player1',
                            attributes: ['id', 'firstName', 'lastName'],
                        },
                        {
                            model: Player,
                            as: 'player2',
                            attributes: ['id', 'firstName', 'lastName'],
                        },
                    ],
                },
            ],
            order: [['createdAt', 'DESC']],
        });

        // Format response
        const pools = rows.map(pool => ({
            id: pool.id,
            name: pool.name,
            teams_count: pool.teams?.length || 0,
            teams: pool.teams || [],
        }));

        return paginatedResponse(
            res,
            pools,
            page,
            limit,
            count,
            'Poules récupérées avec succès'
        );
    })
);

// Get a single pool by ID
router.get(
    '/:id',
    validate(poolIdSchema, 'params'),
    asyncHandler(async (req, res) => {
        const { id } = req.params;

        const pool = await Pool.findByPk(id, {
            include: [
                {
                    model: Team,
                    as: 'teams',
                    include: [
                        { model: Player, as: 'player1' },
                        { model: Player, as: 'player2' },
                    ],
                },
            ],
        });

        if (!pool) {
            throw new NotFoundError('Poule');
        }

        return successResponse(res, pool, 'Poule récupérée avec succès');
    })
);

// Create a new pool
router.post(
    '/',
    validate(createPoolSchema, 'body'),
    asyncHandler(async (req, res) => {
        const { name, teamIds } = req.body;

        // Verify all teams exist
        const teams = await Team.findAll({
            where: { id: teamIds },
        });

        if (teams.length !== 6) {
            throw new ValidationError('Les 6 équipes doivent exister');
        }

        // Verify teams are not already in a pool
        const teamsInPool = teams.filter(team => team.poolId !== null);
        if (teamsInPool.length > 0) {
            throw new ValidationError('Certaines équipes sont déjà dans une poule');
        }

        // Create pool
        const pool = await Pool.create({ name });

        // Assign teams to pool
        await Team.update(
            { poolId: pool.id },
            { where: { id: teamIds } }
        );

        // Fetch pool with teams
        const poolWithTeams = await Pool.findByPk(pool.id, {
            include: [
                {
                    model: Team,
                    as: 'teams',
                    include: [
                        { model: Player, as: 'player1' },
                        { model: Player, as: 'player2' },
                    ],
                },
            ],
        });

        return createdResponse(res, poolWithTeams, 'Poule créée avec succès');
    })
);

// Update a pool
router.put(
    '/:id',
    validate(poolIdSchema, 'params'),
    validate(updatePoolSchema, 'body'),
    asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { name, teamIds } = req.body;

        const pool = await Pool.findByPk(id, {
            include: [
                {
                    model: Team,
                    as: 'teams',
                    include: [
                        {
                            model: require('../models').Match,
                            as: 'matchesAsTeam1',
                        },
                        {
                            model: require('../models').Match,
                            as: 'matchesAsTeam2',
                        },
                    ],
                },
            ],
        });

        if (!pool) {
            throw new NotFoundError('Poule');
        }

        // Check if any team in the pool has played matches
        let hasMatches = false;
        if (pool.teams) {
            for (const team of pool.teams) {
                if (team.matchesAsTeam1?.length > 0 || team.matchesAsTeam2?.length > 0) {
                    hasMatches = true;
                    break;
                }
            }
        }

        if (hasMatches) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'POOL_HAS_MATCHES',
                    message: 'La poule ne peut pas être modifiée car des matchs ont déjà été joués par ses équipes',
                },
            });
        }

        // Update name if provided
        if (name) {
            await pool.update({ name });
        }

        // Update teams if provided
        if (teamIds) {
            // Remove old teams
            await Team.update(
                { poolId: null },
                { where: { poolId: pool.id } }
            );

            // Add new teams
            await Team.update(
                { poolId: pool.id },
                { where: { id: teamIds } }
            );
        }

        const poolWithTeams = await Pool.findByPk(pool.id, {
            include: [
                {
                    model: Team,
                    as: 'teams',
                    include: [
                        { model: Player, as: 'player1' },
                        { model: Player, as: 'player2' },
                    ],
                },
            ],
        });

        return successResponse(res, poolWithTeams, 'Poule mise à jour avec succès');
    })
);

// Delete a pool
router.delete(
    '/:id',
    validate(poolIdSchema, 'params'),
    asyncHandler(async (req, res) => {
        const { id } = req.params;

        const pool = await Pool.findByPk(id, {
            include: [
                {
                    model: Team,
                    as: 'teams',
                    include: [
                        {
                            model: require('../models').Match,
                            as: 'matchesAsTeam1',
                        },
                        {
                            model: require('../models').Match,
                            as: 'matchesAsTeam2',
                        },
                    ],
                },
            ],
        });

        if (!pool) {
            throw new NotFoundError('Poule');
        }

        // Check if any team in the pool has matches
        let hasMatches = false;
        if (pool.teams) {
            for (const team of pool.teams) {
                if (team.matchesAsTeam1?.length > 0 || team.matchesAsTeam2?.length > 0) {
                    hasMatches = true;
                    break;
                }
            }
        }

        if (hasMatches) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'POOL_HAS_MATCHES',
                    message: 'La poule ne peut pas être supprimée car elle contient des équipes ayant joué des matchs',
                },
            });
        }

        // Remove pool from teams
        await Team.update(
            { poolId: null },
            { where: { poolId: pool.id } }
        );

        await pool.destroy();

        return successResponse(res, null, 'Poule supprimée avec succès');
    })
);

module.exports = router;
