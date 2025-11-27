// ============================================
// FICHIER : backend/routes/events.js
// ============================================

const express = require('express');
const router = express.Router();
const { Event, Match, Team, Player } = require('../models');
const { validate } = require('../middleware/validator');
const { asyncHandler, NotFoundError, ValidationError } = require('../middleware/errorHandler');
const {
    successResponse,
    createdResponse,
    paginatedResponse,
    getPaginationParams,
} = require('../utils/response');
const {
    createEventSchema,
    updateEventSchema,
    eventIdSchema,
    listEventsQuerySchema,
} = require('../validators/event.validator');

// List all events with pagination and filters
router.get(
    '/',
    validate(listEventsQuerySchema, 'query'),
    asyncHandler(async (req, res) => {
        const { page, limit, offset } = getPaginationParams(req.query);
        const { startDate, endDate, month } = req.query;

        const where = {};

        // Apply filters
        if (month) {
            // Filter by specific month YYYY-MM
            const [year, monthNum] = month.split('-');
            const startOfMonth = `${year}-${monthNum}-01`;
            const endOfMonth = new Date(parseInt(year), parseInt(monthNum), 0).toISOString().split('T')[0];
            where.eventDate = {
                [require('sequelize').Op.between]: [startOfMonth, endOfMonth],
            };
        } else {
            if (startDate) {
                where.eventDate = {
                    ...where.eventDate,
                    [require('sequelize').Op.gte]: startDate,
                };
            }
            if (endDate) {
                where.eventDate = {
                    ...where.eventDate,
                    [require('sequelize').Op.lte]: endDate,
                };
            }
        }

        const { count, rows } = await Event.findAndCountAll({
            where,
            limit,
            offset,
            include: [
                {
                    model: Match,
                    as: 'matches',
                    include: [
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
                },
            ],
            order: [['eventDate', 'DESC'], ['eventTime', 'DESC']],
        });

        return paginatedResponse(
            res,
            rows,
            page,
            limit,
            count,
            'Événements récupérés avec succès'
        );
    })
);

// Get a single event by ID
router.get(
    '/:id',
    validate(eventIdSchema, 'params'),
    asyncHandler(async (req, res) => {
        const { id } = req.params;

        const event = await Event.findByPk(id, {
            include: [
                {
                    model: Match,
                    as: 'matches',
                    include: [
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
                },
            ],
        });

        if (!event) {
            throw new NotFoundError('Événement');
        }

        return successResponse(res, event, 'Événement récupéré avec succès');
    })
);

// Create a new event (with matches)
router.post(
    '/',
    validate(createEventSchema, 'body'),
    asyncHandler(async (req, res) => {
        const { eventDate, eventTime, matches } = req.body;

        // Start transaction
        const result = await require('../models').sequelize.transaction(async (t) => {
            // Create event
            const event = await Event.create(
                { eventDate, eventTime },
                { transaction: t }
            );

            // Create all matches
            const createdMatches = await Promise.all(
                matches.map(match =>
                    Match.create(
                        {
                            eventId: event.id,
                            team1Id: match.team1Id,
                            team2Id: match.team2Id,
                            courtNumber: match.courtNumber,
                            status: 'A_VENIR',
                        },
                        { transaction: t }
                    )
                )
            );

            return { event, matches: createdMatches };
        });

        // Fetch event with matches and teams
        const eventWithMatches = await Event.findByPk(result.event.id, {
            include: [
                {
                    model: Match,
                    as: 'matches',
                    include: [
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
                },
            ],
        });

        return createdResponse(res, eventWithMatches, 'Événement créé avec succès');
    })
);

// Update an event
router.put(
    '/:id',
    validate(eventIdSchema, 'params'),
    validate(updateEventSchema, 'body'),
    asyncHandler(async (req, res) => {
        const { id } = req.params;
        const updateData = req.body;

        const event = await Event.findByPk(id);

        if (!event) {
            throw new NotFoundError('Événement');
        }

        await event.update(updateData);

        return successResponse(res, event, 'Événement mis à jour avec succès');
    })
);

// Delete an event
router.delete(
    '/:id',
    validate(eventIdSchema, 'params'),
    asyncHandler(async (req, res) => {
        const { id } = req.params;

        const event = await Event.findByPk(id, {
            include: [
                {
                    model: Match,
                    as: 'matches',
                },
            ],
        });

        if (!event) {
            throw new NotFoundError('Événement');
        }

        // Check all matches are A_VENIR
        const hasCompletedMatches = event.matches?.some(match =>
            match.status !== 'A_VENIR'
        );

        if (hasCompletedMatches) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'EVENT_HAS_COMPLETED_MATCHES',
                    message: 'L\'événement ne peut pas être supprimé car certains matchs ne sont pas "A_VENIR"',
                },
            });
        }

        // Delete event (CASCADE will delete matches)
        await event.destroy();

        return successResponse(res, null, 'Événement supprimé avec succès');
    })
);

module.exports = router;
