// ============================================
// FICHIER : backend/routes/companies.js
// ============================================

const express = require('express');
const router = express.Router();
const { Company, Player, Team } = require('../models');
const { asyncHandler, NotFoundError } = require('../middleware/errorHandler');
const {
    successResponse,
    createdResponse,
    paginatedResponse,
    getPaginationParams,
} = require('../utils/response');
const { Op } = require('sequelize');

// List all companies with pagination
router.get(
    '/',
    asyncHandler(async (req, res) => {
        const { page, limit, offset } = getPaginationParams(req.query);
        const { search, active } = req.query;

        const where = {};

        if (search) {
            where[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { description: { [Op.like]: `%${search}%` } },
            ];
        }

        if (active !== undefined) {
            where.isActive = active === 'true';
        }

        const { count, rows } = await Company.findAndCountAll({
            where,
            limit,
            offset,
            include: [
                {
                    model: Player,
                    as: 'players',
                    attributes: ['id'],
                },
                {
                    model: Team,
                    as: 'teams',
                    attributes: ['id'],
                },
            ],
            order: [['name', 'ASC']],
        });

        // Add player and team counts
        const companies = rows.map(company => ({
            ...company.toJSON(),
            playerCount: company.players?.length || 0,
            teamCount: company.teams?.length || 0,
        }));

        return paginatedResponse(
            res,
            companies,
            page,
            limit,
            count,
            'Entreprises récupérées avec succès'
        );
    })
);

// Get a single company by ID
router.get(
    '/:id',
    asyncHandler(async (req, res) => {
        const { id } = req.params;

        const company = await Company.findByPk(id, {
            include: [
                {
                    model: Player,
                    as: 'players',
                    attributes: ['id', 'firstName', 'lastName', 'licenseNumber'],
                },
                {
                    model: Team,
                    as: 'teams',
                    attributes: ['id'],
                },
            ],
        });

        if (!company) {
            throw new NotFoundError('Entreprise');
        }

        const companyData = {
            ...company.toJSON(),
            playerCount: company.players?.length || 0,
            teamCount: company.teams?.length || 0,
        };

        return successResponse(res, companyData, 'Entreprise récupérée avec succès');
    })
);

// Create a new company
router.post(
    '/',
    asyncHandler(async (req, res) => {
        const { name, description, logoUrl, contactEmail, contactPhone, isActive } = req.body;

        if (!name || name.trim() === '') {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Le nom de l\'entreprise est requis',
                },
            });
        }

        // Check if company name already exists
        const existingCompany = await Company.findOne({
            where: { name: name.trim() },
        });

        if (existingCompany) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'DUPLICATE_NAME',
                    message: 'Une entreprise avec ce nom existe déjà',
                },
            });
        }

        const company = await Company.create({
            name: name.trim(),
            description,
            logoUrl,
            contactEmail,
            contactPhone,
            isActive: isActive !== undefined ? isActive : true,
        });

        return createdResponse(res, company, 'Entreprise créée avec succès');
    })
);

// Update a company
router.put(
    '/:id',
    asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { name, description, logoUrl, contactEmail, contactPhone, isActive } = req.body;

        const company = await Company.findByPk(id);

        if (!company) {
            throw new NotFoundError('Entreprise');
        }

        // If name is being changed, check for duplicates
        if (name && name.trim() !== company.name) {
            const existingCompany = await Company.findOne({
                where: {
                    name: name.trim(),
                    id: { [Op.ne]: id },
                },
            });

            if (existingCompany) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'DUPLICATE_NAME',
                        message: 'Une entreprise avec ce nom existe déjà',
                    },
                });
            }
        }

        await company.update({
            name: name ? name.trim() : company.name,
            description: description !== undefined ? description : company.description,
            logoUrl: logoUrl !== undefined ? logoUrl : company.logoUrl,
            contactEmail: contactEmail !== undefined ? contactEmail : company.contactEmail,
            contactPhone: contactPhone !== undefined ? contactPhone : company.contactPhone,
            isActive: isActive !== undefined ? isActive : company.isActive,
        });

        return successResponse(res, company, 'Entreprise mise à jour avec succès');
    })
);

// Delete a company
router.delete(
    '/:id',
    asyncHandler(async (req, res) => {
        const { id } = req.params;

        const company = await Company.findByPk(id, {
            include: [
                { model: Player, as: 'players' },
                { model: Team, as: 'teams' },
            ],
        });

        if (!company) {
            throw new NotFoundError('Entreprise');
        }

        // Check if company has players or teams
        if (company.players?.length > 0) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'COMPANY_HAS_PLAYERS',
                    message: 'L\'entreprise ne peut pas être supprimée car elle contient des joueurs',
                },
            });
        }

        if (company.teams?.length > 0) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'COMPANY_HAS_TEAMS',
                    message: 'L\'entreprise ne peut pas être supprimée car elle contient des équipes',
                },
            });
        }

        await company.destroy();

        return successResponse(res, null, 'Entreprise supprimée avec succès');
    })
);

// Attach a player to a company
router.post(
    '/:id/players/:playerId',
    asyncHandler(async (req, res) => {
        const { id, playerId } = req.params;

        const company = await Company.findByPk(id);
        if (!company) {
            throw new NotFoundError('Entreprise');
        }

        const player = await Player.findByPk(playerId);
        if (!player) {
            throw new NotFoundError('Joueur');
        }

        await player.update({
            companyId: id,
            company: company.name, // Keep legacy field in sync
        });

        return successResponse(res, player, 'Joueur attaché à l\'entreprise avec succès');
    })
);

// Detach a player from a company
router.delete(
    '/:id/players/:playerId',
    asyncHandler(async (req, res) => {
        const { id, playerId } = req.params;

        const player = await Player.findByPk(playerId);
        if (!player) {
            throw new NotFoundError('Joueur');
        }

        if (player.companyId !== parseInt(id)) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'PLAYER_NOT_IN_COMPANY',
                    message: 'Le joueur n\'appartient pas à cette entreprise',
                },
            });
        }

        await player.update({
            companyId: null,
            company: null,
        });

        return successResponse(res, player, 'Joueur détaché de l\'entreprise avec succès');
    })
);

// Get players of a company
router.get(
    '/:id/players',
    asyncHandler(async (req, res) => {
        const { id } = req.params;

        const company = await Company.findByPk(id);
        if (!company) {
            throw new NotFoundError('Entreprise');
        }

        const players = await Player.findAll({
            where: { companyId: id },
            order: [['lastName', 'ASC'], ['firstName', 'ASC']],
        });

        return successResponse(res, players, 'Joueurs de l\'entreprise récupérés avec succès');
    })
);

module.exports = router;
