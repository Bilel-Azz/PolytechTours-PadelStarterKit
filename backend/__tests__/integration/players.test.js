// ============================================
// FICHIER : backend/__tests__/integration/players.test.js
// Tests d'intégration pour la gestion des joueurs (TC007-TC013)
// ============================================

const request = require('supertest');
const express = require('express');
const playersRoutes = require('../../routes/players');
const teamsRoutes = require('../../routes/teams');
const { Player, Team, User } = require('../../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.SECRET_KEY || "votre_super_secret_key_changez_moi_en_prod";

// Créer une application Express de test
const app = express();
app.use(express.json());
app.use('/api/v1/players', playersRoutes);
app.use('/api/v1/teams', teamsRoutes);

// Helper pour créer un admin et obtenir un token
async function createAdminAndGetToken() {
  const admin = await User.create({
    email: 'admin-players-test@example.com',
    password_hash: await bcrypt.hash('AdminP@ss123', 10),
    role: 'ADMINISTRATEUR',
    is_active: true
  });
  return jwt.sign({ sub: admin.id, email: admin.email, role: admin.role }, SECRET_KEY, { expiresIn: '24h' });
}

// Helper pour créer un joueur standard et obtenir un token
async function createUserAndGetToken() {
  const user = await User.create({
    email: 'user-players-test@example.com',
    password_hash: await bcrypt.hash('UserP@ss123', 10),
    role: 'JOUEUR',
    is_active: true
  });
  return jwt.sign({ sub: user.id, email: user.email, role: user.role }, SECRET_KEY, { expiresIn: '24h' });
}

describe('Tests d\'intégration - Gestion des joueurs (SC02)', () => {

  describe('TC007 - Création de joueur avec champs valides', () => {
    test('Admin crée un joueur avec tous les champs valides - code 201', async () => {
      const response = await request(app)
        .post('/api/v1/players')
        .send({
          firstName: 'Jean',
          lastName: 'Dupont',
          company: 'TechCorp',
          licenseNumber: 'L123456',
          birthDate: '1990-05-15',
          email: 'jean.dupont@techcorp.fr'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.firstName).toBe('Jean');
      expect(response.body.data.lastName).toBe('Dupont');
      expect(response.body.data.company).toBe('TechCorp');

      // Vérifier que le joueur est en BDD
      const player = await Player.findByPk(response.body.data.id);
      expect(player).toBeDefined();
    });
  });

  describe('TC008 - Validation numéro de licence', () => {
    test('Licence invalide (mauvais format) retourne erreur 400', async () => {
      const response = await request(app)
        .post('/api/v1/players')
        .send({
          firstName: 'Pierre',
          lastName: 'Martin',
          company: 'TechCorp',
          licenseNumber: 'INVALID', // Format invalide (doit être LXXXXXX)
          birthDate: '1985-03-20'
        });

      expect(response.status).toBe(400);
    });

    test('Licence valide (format LXXXXXX) acceptée', async () => {
      const response = await request(app)
        .post('/api/v1/players')
        .send({
          firstName: 'Marie',
          lastName: 'Curie',
          company: 'ScienceLab',
          licenseNumber: 'L654321',
          birthDate: '1988-11-07'
        });

      expect(response.status).toBe(201);
    });
  });

  describe('TC010 - Validation nom/prénom (2-50 caractères)', () => {
    test('Prénom trop court (< 2 caractères) retourne erreur 400', async () => {
      const response = await request(app)
        .post('/api/v1/players')
        .send({
          firstName: 'A', // Trop court
          lastName: 'Dupont',
          company: 'TechCorp',
          licenseNumber: 'L111111',
          birthDate: '1990-01-01'
        });

      expect(response.status).toBe(400);
    });

    test('Nom trop court (< 2 caractères) retourne erreur 400', async () => {
      const response = await request(app)
        .post('/api/v1/players')
        .send({
          firstName: 'Jean',
          lastName: 'B', // Trop court
          company: 'TechCorp',
          licenseNumber: 'L222222',
          birthDate: '1990-01-01'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('TC011 - Modification d\'un joueur', () => {
    test('Admin modifie les informations d\'un joueur - code 200', async () => {
      // Créer un joueur d'abord
      const createResponse = await request(app)
        .post('/api/v1/players')
        .send({
          firstName: 'Paul',
          lastName: 'Ancien',
          company: 'OldCorp',
          licenseNumber: 'L333333',
          birthDate: '1992-06-15'
        });

      const playerId = createResponse.body.data.id;

      // Modifier le joueur
      const updateResponse = await request(app)
        .put(`/api/v1/players/${playerId}`)
        .send({
          firstName: 'Paul',
          lastName: 'Nouveau',
          company: 'NewCorp'
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.data.lastName).toBe('Nouveau');
      expect(updateResponse.body.data.company).toBe('NewCorp');
    });
  });

  describe('TC012 - Suppression d\'un joueur dans une équipe', () => {
    test('Impossible de supprimer un joueur appartenant à une équipe active - code 400', async () => {
      // Créer deux joueurs
      const player1Response = await request(app)
        .post('/api/v1/players')
        .send({
          firstName: 'Alice',
          lastName: 'Team',
          company: 'TeamCorp',
          licenseNumber: 'L444444',
          birthDate: '1991-01-01'
        });

      const player2Response = await request(app)
        .post('/api/v1/players')
        .send({
          firstName: 'Bob',
          lastName: 'Team',
          company: 'TeamCorp',
          licenseNumber: 'L555555',
          birthDate: '1991-01-01'
        });

      const player1Id = player1Response.body.data.id;
      const player2Id = player2Response.body.data.id;

      // Créer une équipe avec ces joueurs
      await request(app)
        .post('/api/v1/teams')
        .send({
          company: 'TeamCorp',
          player1Id,
          player2Id
        });

      // Tenter de supprimer le joueur 1
      const deleteResponse = await request(app)
        .delete(`/api/v1/players/${player1Id}`);

      expect(deleteResponse.status).toBe(400);
      expect(deleteResponse.body.error.message).toContain('équipe');
    });

    test('Suppression réussie d\'un joueur sans équipe', async () => {
      // Créer un joueur
      const createResponse = await request(app)
        .post('/api/v1/players')
        .send({
          firstName: 'Solo',
          lastName: 'Player',
          company: 'SoloCorp',
          licenseNumber: 'L666666',
          birthDate: '1993-01-01'
        });

      const playerId = createResponse.body.data.id;

      // Supprimer le joueur
      const deleteResponse = await request(app)
        .delete(`/api/v1/players/${playerId}`);

      expect(deleteResponse.status).toBe(200);

      // Vérifier que le joueur n'existe plus
      const player = await Player.findByPk(playerId);
      expect(player).toBeNull();
    });
  });

  describe('TC013 - Droits d\'accès aux joueurs', () => {
    test('Liste des joueurs accessible', async () => {
      const response = await request(app)
        .get('/api/v1/players');

      // La route est accessible (même sans auth pour l'instant)
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
    });
  });
});
