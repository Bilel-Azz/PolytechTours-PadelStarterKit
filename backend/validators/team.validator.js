// ============================================
// FICHIER : backend/validators/team.validator.js
// ============================================

const { z } = require('zod');

// Create team schema
const createTeamSchema = z.object({
    company: z.string()
        .min(1, 'Le nom de l\'entreprise est requis')
        .max(100, 'Le nom de l\'entreprise ne peut pas dépasser 100 caractères'),
    player1Id: z.number({
        required_error: 'Le joueur 1 est requis',
        invalid_type_error: 'ID de joueur invalide',
    }),
    player2Id: z.number({
        required_error: 'Le joueur 2 est requis',
        invalid_type_error: 'ID de joueur invalide',
    }),
    poolId: z.number().optional().nullable(),
}).refine(
    (data) => data.player1Id !== data.player2Id,
    {
        message: 'Les deux joueurs doivent être différents',
        path: ['player2Id'],
    }
);

// Update team schema
const updateTeamSchema = z.object({
    company: z.string().min(1).max(100).optional(),
    player1Id: z.number().optional(),
    player2Id: z.number().optional(),
    poolId: z.number().optional().nullable(),
}).refine(
    (data) => {
        if (data.player1Id && data.player2Id) {
            return data.player1Id !== data.player2Id;
        }
        return true;
    },
    {
        message: 'Les deux joueurs doivent être différents',
        path: ['player2Id'],
    }
);

// Get team by ID schema
const teamIdSchema = z.object({
    id: z.string().regex(/^\d+$/, 'ID invalide').transform(Number),
});

// Query schema for listing teams
const listTeamsQuerySchema = z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default('10'),
    poolId: z.string().regex(/^\d+$/).transform(Number).optional(),
    company: z.string().optional(),
});

module.exports = {
    createTeamSchema,
    updateTeamSchema,
    teamIdSchema,
    listTeamsQuerySchema,
};
