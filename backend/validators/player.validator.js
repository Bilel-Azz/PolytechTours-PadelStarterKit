// ============================================
// FICHIER : backend/validators/player.validator.js
// ============================================

const { z } = require('zod');

// Create player schema
const createPlayerSchema = z.object({
    firstName: z.string()
        .min(2, 'Le prénom doit contenir au moins 2 caractères')
        .max(50, 'Le prénom ne peut pas dépasser 50 caractères')
        .regex(/^[a-zA-ZÀ-ÿ\s-]+$/, 'Le prénom ne peut contenir que des lettres, espaces et tirets'),
    lastName: z.string()
        .min(2, 'Le nom doit contenir au moins 2 caractères')
        .max(50, 'Le nom ne peut pas dépasser 50 caractères')
        .regex(/^[a-zA-ZÀ-ÿ\s-]+$/, 'Le nom ne peut contenir que des lettres, espaces et tirets'),
    company: z.string()
        .min(2, 'Le nom de l\'entreprise doit contenir au moins 2 caractères')
        .max(100, 'Le nom de l\'entreprise ne peut pas dépasser 100 caractères'),
    licenseNumber: z.string()
        .regex(/^L\d{6}$/, 'Le numéro de licence doit être au format LXXXXXX'),
    birthDate: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide (format: YYYY-MM-DD)')
        .optional()
        .nullable(),
    email: z.string()
        .email('Email invalide')
        .optional(),  // Email optionnel lors de la création du joueur
});

// Update player schema (all fields optional)
const updatePlayerSchema = z.object({
    firstName: z.string()
        .min(2)
        .max(50)
        .regex(/^[a-zA-ZÀ-ÿ\s-]+$/)
        .optional(),
    lastName: z.string()
        .min(2)
        .max(50)
        .regex(/^[a-zA-ZÀ-ÿ\s-]+$/)
        .optional(),
    company: z.string()
        .min(2)
        .max(100)
        .optional(),
    birthDate: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional()
        .nullable(),
    email: z.string()
        .email()
        .optional(),
});

// Get player by ID schema
const playerIdSchema = z.object({
    id: z.string().regex(/^\d+$/, 'ID invalide').transform(Number),
});

// Query schema for listing players
const listPlayersQuerySchema = z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default('10'),
    company: z.string().optional(),
    search: z.string().optional(),
});

module.exports = {
    createPlayerSchema,
    updatePlayerSchema,
    playerIdSchema,
    listPlayersQuerySchema,
};
