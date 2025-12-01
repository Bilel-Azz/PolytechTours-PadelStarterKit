// ============================================
// FICHIER : backend/routes/matches.js
// ============================================

const express = require('express');
const router = express.Router();
const { Match, Event, Team, Player } = require('../models');
const { validate } = require('../middleware/validator');
const { asyncHandler, NotFoundError } = require('../middleware/errorHandler');
const {
    successResponse,
    createdResponse,
    paginatedResponse,
    getPaginationParams,
} = require('../utils/response');
const {
    createMatchSchema,
    updateMatchSchema,
    matchIdSchema,
    listMatchesQuerySchema,
} = require('../validators/match.validator');
const { Op } = require('sequelize');

// List all matches with pagination and filters
router.get(
    '/',
    validate(listMatchesQuerySchema, 'query'),
    asyncHandler(async (req, res) => {
        const { page, limit, offset } = getPaginationParams(req.query);
        const { eventId, teamId, status, upcoming, myMatches } = req.query;

        const where = {};

        if (eventId) {
            where.eventId = eventId;
        }

        if (status) {
            where.status = status;
        }

        if (teamId) {
            where[Op.or] = [
                { team1Id: teamId },
                { team2Id: teamId },
            ];
        }

        // Filter for upcoming matches (next 30 days)
        if (upcoming) {
            const today = new Date();
            const in30Days = new Date();
            in30Days.setDate(today.getDate() + 30);

            where['$event.eventDate$'] = {
                [Op.between]: [today.toISOString().split('T')[0], in30Days.toISOString().split('T')[0]],
            };
        }

        // TODO: myMatches filter requires authentication and user context
        // This will be implemented with the auth middleware

        const { count, rows } = await Match.findAndCountAll({
            where,
            limit,
            offset,
            include: [
                {
                    model: Event,
                    as: 'event',
                    attributes: ['id', 'eventDate', 'eventTime'],
                },
                {
                    model: Team,
                    as: 'team1',
                    include: [
                        { model: Player, as: 'player1', attributes: ['id', 'firstName', 'lastName', 'company'] },
                        { model: Player, as: 'player2', attributes: ['id', 'firstName', 'lastName', 'company'] },
                    ],
                },
                {
                    model: Team,
                    as: 'team2',
                    include: [
                        { model: Player, as: 'player1', attributes: ['id', 'firstName', 'lastName', 'company'] },
                        { model: Player, as: 'player2', attributes: ['id', 'firstName', 'lastName', 'company'] },
                    ],
                },
            ],
            order: [
                [{ model: Event, as: 'event' }, 'eventDate', 'ASC'],
                [{ model: Event, as: 'event' }, 'eventTime', 'ASC'],
            ],
        });

        // Format response
        const matches = rows.map(match => ({
            id: match.id,
            event: {
                date: match.event.eventDate,
                time: match.event.eventTime,
            },
            court_number: match.courtNumber,
            team1: {
                id: match.team1.id,
                company: match.team1.company,
                players: [
                    {
                        id: match.team1.player1.id,
                        first_name: match.team1.player1.firstName,
                        last_name: match.team1.player1.lastName,
                    },
                    {
                        id: match.team1.player2.id,
                        first_name: match.team1.player2.firstName,
                        last_name: match.team1.player2.lastName,
                    },
                ],
            },
            team2: {
                id: match.team2.id,
                company: match.team2.company,
                players: [
                    {
                        id: match.team2.player1.id,
                        first_name: match.team2.player1.firstName,
                        last_name: match.team2.player1.lastName,
                    },
                    {
                        id: match.team2.player2.id,
                        first_name: match.team2.player2.firstName,
                        last_name: match.team2.player2.lastName,
                    },
                ],
            },
            status: match.status,
            score_team1: match.scoreTeam1,
            score_team2: match.scoreTeam2,
        }));

        return paginatedResponse(
            res,
            matches,
            page,
            limit,
            count,
            'Matchs récupérés avec succès'
        );
    })
);

// Get a single match by ID
router.get(
    '/:id',
    validate(matchIdSchema, 'params'),
    asyncHandler(async (req, res) => {
        const { id } = req.params;

        const match = await Match.findByPk(id, {
            include: [
                {
                    model: Event,
                    as: 'event',
                },
                {
                    model: Team,
                    as: 'team1',
                    include: [
                        { model: Player, as: 'player1' },
                        { model: Player, as: 'player2' },
                    ],
                },
                {
                    model: Team,
                    as: 'team2',
                    include: [
                        { model: Player, as: 'player1' },
                        { model: Player, as: 'player2' },
                    ],
                },
            ],
        });

        if (!match) {
            throw new NotFoundError('Match');
        }

        return successResponse(res, match, 'Match récupéré avec succès');
    })
);

// Create a new match
router.post(
    '/',
    validate(createMatchSchema, 'body'),
    asyncHandler(async (req, res) => {
        const matchData = req.body;

        // Verify event exists
        const event = await Event.findByPk(matchData.eventId);
        if (!event) {
            throw new NotFoundError('Événement');
        }

        // Verify both teams exist
        const team1 = await Team.findByPk(matchData.team1Id);
        const team2 = await Team.findByPk(matchData.team2Id);

        if (!team1 || !team2) {
            throw new NotFoundError('Équipe');
        }

        const match = await Match.create(matchData);

        const matchWithRelations = await Match.findByPk(match.id, {
            include: [
                { model: Event, as: 'event' },
                { model: Team, as: 'team1' },
                { model: Team, as: 'team2' },
            ],
        });

        return createdResponse(res, matchWithRelations, 'Match créé avec succès');
    })
);

// Update a match (usually for updating scores and status)
router.put(
    '/:id',
    validate(matchIdSchema, 'params'),
    validate(updateMatchSchema, 'body'),
    asyncHandler(async (req, res) => {
        const { id } = req.params;
        const updateData = req.body;

        const match = await Match.findByPk(id);

        if (!match) {
            throw new NotFoundError('Match');
        }

        await match.update(updateData);

        const matchWithRelations = await Match.findByPk(match.id, {
            include: [
                { model: Event, as: 'event' },
                { model: Team, as: 'team1' },
                { model: Team, as: 'team2' },
            ],
        });

        return successResponse(res, matchWithRelations, 'Match mis à jour avec succès');
    })
);

// Delete a match
router.delete(
    '/:id',
    validate(matchIdSchema, 'params'),
    asyncHandler(async (req, res) => {
        const { id } = req.params;

        const match = await Match.findByPk(id);

        if (!match) {
            throw new NotFoundError('Match');
        }

        // Only allow deletion if status is A_VENIR
        if (match.status !== 'A_VENIR') {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'MATCH_NOT_UPCOMING',
                    message: 'Seuls les matchs avec le statut "A_VENIR" peuvent être supprimés',
                },
            });
        }

        await match.destroy();

        return successResponse(res, null, 'Match supprimé avec succès');
    })
);

module.exports = router;
