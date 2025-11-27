// ============================================
// FICHIER : backend/validators/match.validator.js
// ============================================

const { z } = require('zod');

// Match status enum
const MatchStatus = z.enum(['A_VENIR', 'TERMINE', 'ANNULE']);

// Score validation helper
const scoreSchema = z.string()
    .regex(/^(\d+-\d+)(,\s*\d+-\d+){1,2}$/, 'Format de score invalide (ex: "6-4, 6-3" ou "6-4, 3-6, 7-5")')
    .refine((score) => {
        // Validate each set follows padel rules
        const sets = score.split(',').map(s => s.trim());

        for (const set of sets) {
            const [score1, score2] = set.split('-').map(Number);
            const max = Math.max(score1, score2);
            const min = Math.min(score1, score2);

            // Valid scores: 6-0 to 6-4, 7-5, 7-6
            const isValid =
                (max === 6 && min <= 4) ||
                (max === 7 && (min === 5 || min === 6));

            if (!isValid) return false;
        }
        return true;
    }, 'Scores de sets invalides (un set se joue en 6 jeux, ou 7 en tie-break)');

// Create match schema
const createMatchSchema = z.object({
    eventId: z.number({ required_error: 'L\'événement est requis' }),
    team1Id: z.number({ required_error: 'L\'équipe  1 est requise' }),
    team2Id: z.number({ required_error: 'L\'équipe 2 est requise' }),
    courtNumber: z.number()
        .int()
        .min(1, 'Le numéro de piste doit être entre 1 et 10')
        .max(10, 'Le numéro de piste doit être entre 1 et 10'),
    status: MatchStatus.default('A_VENIR'),
}).refine(
    (data) => data.team1Id !== data.team2Id,
    {
        message: 'Une équipe ne peut pas jouer contre elle-même',
        path: ['team2Id'],
    }
);

// Update match schema (for updating scores)
const updateMatchSchema = z.object({
    courtNumber: z.number().int().min(1).max(10).optional(),
    status: MatchStatus.optional(),
    scoreTeam1: scoreSchema.optional().nullable(),
    scoreTeam2: scoreSchema.optional().nullable(),
});

// Get match by ID schema
const matchIdSchema = z.object({
    id: z.string().regex(/^\d+$/, 'ID invalide').transform(Number),
});

// Query schema for listing matches
const listMatchesQuerySchema = z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default('10'),
    eventId: z.string().regex(/^\d+$/).transform(Number).optional(),
    teamId: z.string().regex(/^\d+$/).transform(Number).optional(),
    status: MatchStatus.optional(),
    upcoming: z.string().transform(val => val === 'true').optional(),
    myMatches: z.string().transform(val => val === 'true').optional(),
});

module.exports = {
    createMatchSchema,
    updateMatchSchema,
    matchIdSchema,
    listMatchesQuerySchema,
};
