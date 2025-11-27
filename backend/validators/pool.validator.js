// ============================================
// FICHIER : backend/validators/pool.validator.js
// ============================================

const { z } = require('zod');

// Create pool schema - must have exactly 6 teams
const createPoolSchema = z.object({
    name: z.string()
        .min(1, 'Le nom de la poule est requis')
        .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
    teamIds: z.array(z.number())
        .length(6, 'Une poule doit contenir exactement 6 équipes'),
});

// Update pool schema
const updatePoolSchema = z.object({
    name: z.string()
        .min(1, 'Le nom de la poule est requis')
        .max(100, 'Le nom ne peut pas dépasser 100 caractères')
        .optional(),
    teamIds: z.array(z.number())
        .length(6, 'Une poule doit contenir exactement 6 équipes')
        .optional(),
});

// Get pool by ID schema
const poolIdSchema = z.object({
    id: z.string().regex(/^\d+$/, 'ID invalide').transform(Number),
});

// Query schema for listing pools
const listPoolsQuerySchema = z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default('10'),
});

module.exports = {
    createPoolSchema,
    updatePoolSchema,
    poolIdSchema,
    listPoolsQuerySchema,
};
