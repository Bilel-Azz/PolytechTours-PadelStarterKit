// ============================================
// FICHIER : backend/routes/results.js
// ============================================

const express = require('express');
const router = express.Router();
const { Match, Event, Team, Player } = require('../models');
const { asyncHandler } = require('../middleware/errorHandler');
const { successResponse } = require('../utils/response');
const { Op } = require('sequelize');

// Get user's match results (requires auth - placeholder for now)
router.get(
    '/my-results',
    asyncHandler(async (req, res) => {
        // TODO: Get user from auth middleware
        // const userId = req.user.id;

        // For now, return example structure
        // In production, this would:
        // 1. Get player from userId
        // 2. Find all teams where player is player1 or player2
        // 3. Find all matches for those teams with status TERMINE
        // 4. Calculate statistics

        const results = {
            results: [],
            statistics: {
                total_matches: 0,
                wins: 0,
                losses: 0,
                win_rate: 0.0,
            },
        };

        return successResponse(res, results, 'Résultats récupérés avec succès');
    })
);

// Get company rankings
router.get(
    '/rankings',
    asyncHandler(async (req, res) => {
        // Get all completed matches
        const matches = await Match.findAll({
            where: { status: 'TERMINE' },
            include: [
                {
                    model: Team,
                    as: 'team1',
                    attributes: ['id', 'company'],
                },
                {
                    model: Team,
                    as: 'team2',
                    attributes: ['id', 'company'],
                },
            ],
        });

        // Calculate rankings by company
        const companyStats = {};

        matches.forEach(match => {
            const company1 = match.team1.company;
            const company2 = match.team2.company;

            // Initialize companies if not exist
            if (!companyStats[company1]) {
                companyStats[company1] = {
                    company: company1,
                    matches_played: 0,
                    wins: 0,
                    losses: 0,
                    points: 0,
                    sets_won: 0,
                    sets_lost: 0,
                };
            }

            if (!companyStats[company2]) {
                companyStats[company2] = {
                    company: company2,
                    matches_played: 0,
                    wins: 0,
                    losses: 0,
                    points: 0,
                    sets_won: 0,
                    sets_lost: 0,
                };
            }

            // Parse scores
            if (match.scoreTeam1 && match.scoreTeam2) {
                const sets1 = match.scoreTeam1.split(',').map(s => s.trim());
                const sets2 = match.scoreTeam2.split(',').map(s => s.trim());

                let team1SetsWon = 0;
                let team2SetsWon = 0;
                let team1GamesWon = 0;
                let team2GamesWon = 0;

                // Count sets and games
                sets1.forEach((set, index) => {
                    const [score1, score2] = set.split('-').map(Number);
                    const [_, score2b] = sets2[index].split('-').map(Number);

                    team1GamesWon += score1;
                    team2GamesWon += score2;

                    if (score1 > score2) team1SetsWon++;
                    else team2SetsWon++;
                });

                companyStats[company1].matches_played++;
                companyStats[company2].matches_played++;

                // Determine winner (best of 3 sets)
                if (team1SetsWon > team2SetsWon) {
                    companyStats[company1].wins++;
                    companyStats[company1].points += 3; // 3 points for win
                    companyStats[company2].losses++;
                } else {
                    companyStats[company2].wins++;
                    companyStats[company2].points += 3;
                    companyStats[company1].losses++;
                }

                companyStats[company1].sets_won += team1SetsWon;
                companyStats[company1].sets_lost += team2SetsWon;
                companyStats[company2].sets_won += team2SetsWon;
                companyStats[company2].sets_lost += team1SetsWon;
            }
        });

        // Convert to array and sort by points, then by sets won
        const rankings = Object.values(companyStats)
            .sort((a, b) => {
                if (b.points !== a.points) return b.points - a.points;
                return b.sets_won - a.sets_won;
            })
            .map((stat, index) => ({
                position: index + 1,
                ...stat,
            }));

        return successResponse(res, { rankings }, 'Classement récupéré avec succès');
    })
);

module.exports = router;
