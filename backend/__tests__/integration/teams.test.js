// ============================================
// FICHIER : backend/__tests__/integration/teams.test.js
// Tests d'intégration pour la gestion des équipes (TC014-TC018)
// ============================================

const request = require('supertest');
const express = require('express');
const teamsRoutes = require('../../routes/teams');
const { Player, Team, Match, Event } = require('../../models');
const { errorHandler } = require('../../middleware/errorHandler');

// Créer une application Express de test
const app = express();
app.use(express.json());
app.use('/api/v1/teams', teamsRoutes);
app.use(errorHandler);

// Helper pour créer des joueurs directement en BDD
async function createPlayerDirect(data) {
  return await Player.create(data);
}

describe('Tests d\'intégration - Gestion des équipes (SC03)', () => {

  describe('TC014 - Création d\'équipe avec 2 joueurs même entreprise', () => {
    test('Admin crée une équipe avec 2 joueurs de la même entreprise - code 201', async () => {
      const player1 = await createPlayerDirect({
        firstName: 'Team1',
        lastName: 'PlayerA',
        company: 'SameCorp',
        licenseNumber: 'L700001',
        birthDate: '1990-01-01'
      });

      const player2 = await createPlayerDirect({
        firstName: 'Team1',
        lastName: 'PlayerB',
        company: 'SameCorp',
        licenseNumber: 'L700002',
        birthDate: '1990-01-01'
      });

      const response = await request(app)
        .post('/api/v1/teams')
        .send({
          company: 'SameCorp',
          player1Id: player1.id,
          player2Id: player2.id
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.company).toBe('SameCorp');
    });
  });

  describe('TC015 - Validation entreprise des joueurs', () => {
    test('Erreur 400 si joueurs d\'entreprises différentes', async () => {
      const player1 = await createPlayerDirect({
        firstName: 'Diff1',
        lastName: 'Corp1',
        company: 'Company1',
        licenseNumber: 'L700003',
        birthDate: '1990-01-01'
      });

      const player2 = await createPlayerDirect({
        firstName: 'Diff2',
        lastName: 'Corp2',
        company: 'Company2',
        licenseNumber: 'L700004',
        birthDate: '1990-01-01'
      });

      const response = await request(app)
        .post('/api/v1/teams')
        .send({
          company: 'Company1',
          player1Id: player1.id,
          player2Id: player2.id
        });

      expect(response.status).toBe(400);
      // Vérifier que l'erreur mentionne l'entreprise (différents formats possibles)
      const errorMsg = response.body.error?.message || response.body.message || JSON.stringify(response.body);
      expect(errorMsg.toLowerCase()).toContain('entreprise');
    });
  });

  describe('TC016 - Un joueur ne peut être que dans une seule équipe', () => {
    test('Erreur 400 si joueur déjà dans une équipe', async () => {
      const player1 = await createPlayerDirect({
        firstName: 'Single1',
        lastName: 'Team',
        company: 'SingleCorp',
        licenseNumber: 'L700005',
        birthDate: '1990-01-01'
      });

      const player2 = await createPlayerDirect({
        firstName: 'Single2',
        lastName: 'Team',
        company: 'SingleCorp',
        licenseNumber: 'L700006',
        birthDate: '1990-01-01'
      });

      const player3 = await createPlayerDirect({
        firstName: 'Single3',
        lastName: 'Team',
        company: 'SingleCorp',
        licenseNumber: 'L700007',
        birthDate: '1990-01-01'
      });

      // Créer la première équipe
      await request(app)
        .post('/api/v1/teams')
        .send({
          company: 'SingleCorp',
          player1Id: player1.id,
          player2Id: player2.id
        });

      // Tenter de créer une deuxième équipe avec player1 (déjà dans une équipe)
      const response = await request(app)
        .post('/api/v1/teams')
        .send({
          company: 'SingleCorp',
          player1Id: player1.id,
          player2Id: player3.id
        });

      expect(response.status).toBe(400);
      const errorMsg = response.body.error?.message || response.body.message || JSON.stringify(response.body);
      expect(errorMsg.toLowerCase()).toContain('équipe');
    });
  });

  describe('TC017 - Suppression d\'équipe avec matchs', () => {
    test('Impossible de supprimer une équipe ayant joué des matchs', async () => {
      // Créer 4 joueurs pour 2 équipes
      const players = [];
      for (let i = 1; i <= 4; i++) {
        const player = await createPlayerDirect({
          firstName: `Match${i}`,
          lastName: 'Player',
          company: 'MatchCorp',
          licenseNumber: `L80000${i}`,
          birthDate: '1990-01-01'
        });
        players.push(player);
      }

      // Créer deux équipes
      const team1Response = await request(app)
        .post('/api/v1/teams')
        .send({
          company: 'MatchCorp',
          player1Id: players[0].id,
          player2Id: players[1].id
        });

      const team2Response = await request(app)
        .post('/api/v1/teams')
        .send({
          company: 'MatchCorp',
          player1Id: players[2].id,
          player2Id: players[3].id
        });

      const team1Id = team1Response.body.data.id;
      const team2Id = team2Response.body.data.id;

      // Créer un événement d'abord (requis pour le match)
      const event = await Event.create({
        eventDate: new Date(),
        eventTime: '14:00'
      });

      // Créer un match entre les équipes
      await Match.create({
        eventId: event.id,
        team1Id,
        team2Id,
        courtNumber: 1,
        status: 'TERMINE',
        scoreTeam1: '6-4',
        scoreTeam2: '4-6'
      });

      // Tenter de supprimer l'équipe 1
      const deleteResponse = await request(app)
        .delete(`/api/v1/teams/${team1Id}`);

      expect(deleteResponse.status).toBe(400);
      const errorMsg = deleteResponse.body.error?.message || deleteResponse.body.message || JSON.stringify(deleteResponse.body);
      expect(errorMsg.toLowerCase()).toContain('match');
    });
  });

  describe('TC018 - Validation player1 != player2', () => {
    test('Erreur si player1Id === player2Id', async () => {
      const player = await createPlayerDirect({
        firstName: 'Same',
        lastName: 'Player',
        company: 'SameCorp2',
        licenseNumber: 'L700010',
        birthDate: '1990-01-01'
      });

      const response = await request(app)
        .post('/api/v1/teams')
        .send({
          company: 'SameCorp2',
          player1Id: player.id,
          player2Id: player.id
        });

      expect(response.status).toBe(400);
    });
  });

  describe('Liste et récupération des équipes', () => {
    test('Liste des équipes retourne les données', async () => {
      const response = await request(app)
        .get('/api/v1/teams');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('Récupération d\'une équipe par ID', async () => {
      const player1 = await createPlayerDirect({
        firstName: 'Get1',
        lastName: 'Team',
        company: 'GetCorp',
        licenseNumber: 'L700011',
        birthDate: '1990-01-01'
      });

      const player2 = await createPlayerDirect({
        firstName: 'Get2',
        lastName: 'Team',
        company: 'GetCorp',
        licenseNumber: 'L700012',
        birthDate: '1990-01-01'
      });

      const createResponse = await request(app)
        .post('/api/v1/teams')
        .send({
          company: 'GetCorp',
          player1Id: player1.id,
          player2Id: player2.id
        });

      const teamId = createResponse.body.data.id;

      const getResponse = await request(app)
        .get(`/api/v1/teams/${teamId}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.data.id).toBe(teamId);
    });
  });
});
