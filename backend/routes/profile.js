// ============================================
// FICHIER : backend/routes/profile.js
// ============================================

const express = require('express');
const router = express.Router();
const { User, Player } = require('../models');
const { asyncHandler, NotFoundError } = require('../middleware/errorHandler');
const { successResponse } = require('../utils/response');

// Get current user profile
router.get(
    '/me',
    asyncHandler(async (req, res) => {
        // TODO: Get user from auth middleware
        // const userId = req.user.id;

        // Placeholder response
        const profile = {
            user: {
                id: 1,
                email: 'example@example.com',
                role: 'JOUEUR',
            },
            player: {
                id: 1,
                first_name: 'John',
                last_name: 'Doe',
                company: 'Tech Corp',
                license_number: 'L123456',
                birth_date: '1990-05-15',
                photo_url: null,
            },
        };

        return successResponse(res, profile, 'Profil récupéré avec succès');
    })
);

// Update current user profile
router.put(
    '/me',
    asyncHandler(async (req, res) => {
        // TODO: Get user from auth middleware
        // const userId = req.user.id;

        const { firstName, lastName, birthDate, email } = req.body;

        // Update player and user info
        // This would update the Player record associated with the user

        return successResponse(res, {}, 'Profil mis à jour avec succès');
    })
);

// Upload profile photo
router.post(
    '/me/photo',
    asyncHandler(async (req, res) => {
        // TODO: Implement file upload with multer
        // 1. Validate file type (jpg, jpeg, png)
        // 2. Validate file size (max 2MB)
        // 3. Save file to /uploads directory
        // 4. Update player.photoUrl

        return successResponse(res, { photo_url: '/uploads/profile_1.jpg' }, 'Photo uploadée avec succès');
    })
);

// Delete profile photo
router.delete(
    '/me/photo',
    asyncHandler(async (req, res) => {
        // TODO: Get user from auth middleware
        // Delete file from uploads directory
        // Set player.photoUrl to null

        return successResponse(res, null, 'Photo supprimée avec succès');
    })
);

module.exports = router;
