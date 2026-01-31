// ============================================
// FICHIER : backend/validators/event.validator.js
// ============================================

const { z } = require('zod');

// Helper to validate date is today or future
const isTodayOrFuture = (dateStr) => {
    const inputDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return inputDate >= today;
};

// Create event schema (matches optional)
const createEventSchema = z.object({
    eventDate: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide (format: YYYY-MM-DD)'),
    eventTime: z.string()
        .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Heure invalide (format: HH:MM)'),
    matches: z.array(z.object({
        team1Id: z.number(),
        team2Id: z.number(),
        courtNumber: z.number().int().min(1).max(10),
    }))
        .max(10, 'Maximum 10 matchs par événement')
        .optional(),
});

// Update event schema
const updateEventSchema = z.object({
    eventDate: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .refine(isTodayOrFuture, 'La date de l\'événement doit être aujourd\'hui ou dans le futur')
        .optional(),
    eventTime: z.string()
        .regex(/^([01]\d|2[0-3]):([0-5]\d)$/)
        .optional(),
});

// Get event by ID schema
const eventIdSchema = z.object({
    id: z.string().regex(/^\d+$/, 'ID invalide').transform(Number),
});

// Query schema for listing events
const listEventsQuerySchema = z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default('10'),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
});

module.exports = {
    createEventSchema,
    updateEventSchema,
    eventIdSchema,
    listEventsQuerySchema,
};
