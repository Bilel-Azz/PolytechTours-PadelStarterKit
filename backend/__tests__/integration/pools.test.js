// ============================================
// FICHIER : backend/__tests__/integration/pools.test.js
// Tests d'intégration pour la gestion des poules (TC019-TC023)
// ============================================

const request = require('supertest');
const express = require('express');
const poolsRoutes = require('../../routes/pools');
const teamsRoutes = require('../../routes/teams');
const { Player, Team, Pool, Match, Event } = require('../../models');
const { errorHandler } = require('../../middleware/errorHandler');

// Créer une application Express de test
const app = express();
app.use(express.json());
app.use('/api/v1/pools', poolsRoutes);
app.use('/api/v1/teams', teamsRoutes);
app.use(errorHandler);

// Counter pour éviter les doublons de licences
let licenseCounter = 900000;

// Helper pour créer un joueur directement en BDD
async function createPlayerDirect(company) {
  licenseCounter++;
  return await Player.create({
    firstName: `Player${licenseCounter}`,
    lastName: 'Test',
    company,
    licenseNumber: `L${licenseCounter}`,
    birthDate: '1990-01-01'
  });
}

// Helper pour créer une équipe via API
async function createTeamDirect(company) {
  const player1 = await createPlayerDirect(company);
  const player2 = await createPlayerDirect(company);

  const response = await request(app)
    .post('/api/v1/teams')
    .send({
      company,
      player1Id: player1.id,
      player2Id: player2.id
    });

  return response.body.data;
}

// Helper pour créer 6 équipes
async function createSixTeams(companyPrefix) {
  const teams = [];
  for (let i = 1; i <= 6; i++) {
    const team = await createTeamDirect(`${companyPrefix}Corp${i}`);
    teams.push(team);
  }
  return teams;
}

describe('Tests d\'intégration - Gestion des poules (SC04)', () => {

  describe('TC019 - Création de poule avec 6 équipes', () => {
    test('Admin crée une poule avec exactement 6 équipes - code 201', async () => {
      const teams = await createSixTeams('TC19');
      const teamIds = teams.map(t => t.id);

      const response = await request(app)
        .post('/api/v1/pools')
        .send({
          name: 'Poule A Test',
          teamIds
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.name).toBe('Poule A Test');
    });
  });

  describe('TC020 - Validation: exactement 6 équipes (trop peu)', () => {
    test('Erreur 400 si moins de 6 équipes (5 équipes)', async () => {
      // Créer seulement 5 équipes
      const teams = [];
      for (let i = 1; i <= 5; i++) {
        const team = await createTeamDirect(`TC20Corp${i}`);
        teams.push(team);
      }

      const teamIds = teams.map(t => t.id);

      const response = await request(app)
        .post('/api/v1/pools')
        .send({
          name: 'Poule Incomplete',
          teamIds
        });

      expect(response.status).toBe(400);
    });
  });

  describe('TC021 - Validation: exactement 6 équipes (trop)', () => {
    test('Erreur 400 si plus de 6 équipes (7 équipes)', async () => {
      // Créer 7 équipes
      const teams = [];
      for (let i = 1; i <= 7; i++) {
        const team = await createTeamDirect(`TC21Corp${i}`);
        teams.push(team);
      }

      const teamIds = teams.map(t => t.id);

      const response = await request(app)
        .post('/api/v1/pools')
        .send({
          name: 'Poule TooMany',
          teamIds
        });

      expect(response.status).toBe(400);
    });
  });

  describe('TC022 - Unicité du nom de poule', () => {
    test('Erreur si nom de poule déjà existant', async () => {
      // Créer 12 équipes pour 2 poules
      const teams1 = await createSixTeams('TC22A');
      const teams2 = await createSixTeams('TC22B');

      // Créer la première poule
      await request(app)
        .post('/api/v1/pools')
        .send({
          name: 'Poule Unique Test',
          teamIds: teams1.map(t => t.id)
        });

      // Tenter de créer une deuxième poule avec le même nom
      const response = await request(app)
        .post('/api/v1/pools')
        .send({
          name: 'Poule Unique Test',
          teamIds: teams2.map(t => t.id)
        });

      // Devrait échouer (409 ou 400 selon l'implémentation)
      expect([400, 409, 500]).toContain(response.status);
    });
  });

  describe('TC023 - Suppression de poule avec matchs', () => {
    test('Impossible de supprimer une poule avec des matchs joués', async () => {
      // Créer 6 équipes et une poule
      const teams = await createSixTeams('TC23');
      const teamIds = teams.map(t => t.id);

      const poolResponse = await request(app)
        .post('/api/v1/pools')
        .send({
          name: 'Poule With Matches Test',
          teamIds
        });

      const poolId = poolResponse.body.data.id;

      // Créer un événement d'abord (requis pour le match)
      const event = await Event.create({
        eventDate: new Date(),
        eventTime: '14:00'
      });

      // Créer un match entre deux équipes de la poule
      await Match.create({
        eventId: event.id,
        team1Id: teamIds[0],
        team2Id: teamIds[1],
        courtNumber: 1,
        status: 'TERMINE',
        scoreTeam1: '6-4',
        scoreTeam2: '4-6'
      });

      // Tenter de supprimer la poule
      const deleteResponse = await request(app)
        .delete(`/api/v1/pools/${poolId}`);

      expect(deleteResponse.status).toBe(400);
      const errorMsg = deleteResponse.body.error?.message || deleteResponse.body.message || JSON.stringify(deleteResponse.body);
      expect(errorMsg.toLowerCase()).toContain('match');
    });

    test('Suppression réussie d\'une poule sans matchs', async () => {
      // Créer 6 équipes et une poule
      const teams = await createSixTeams('TC23B');
      const teamIds = teams.map(t => t.id);

      const poolResponse = await request(app)
        .post('/api/v1/pools')
        .send({
          name: 'Poule No Matches Test',
          teamIds
        });

      const poolId = poolResponse.body.data.id;

      // Supprimer la poule (pas de matchs)
      const deleteResponse = await request(app)
        .delete(`/api/v1/pools/${poolId}`);

      expect(deleteResponse.status).toBe(200);

      // Vérifier que la poule n'existe plus
      const pool = await Pool.findByPk(poolId);
      expect(pool).toBeNull();
    });
  });

  describe('Liste et récupération des poules', () => {
    test('Liste des poules retourne les données', async () => {
      const response = await request(app)
        .get('/api/v1/pools');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});
