// ============================================
// FICHIER : backend/__tests__/unit/security.test.js
// Tests unitaires pour les fonctionnalités de sécurité
// ============================================

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('../helpers/testHelpers');

describe('Tests unitaires de sécurité', () => {

  describe('Hashing bcrypt', () => {
    test('Le hash ne doit pas être identique au mot de passe en clair', async () => {
      const password = 'TestP@ssw0rd123';
      const hash = await bcrypt.hash(password, 10);

      expect(hash).not.toBe(password);
      expect(hash).toMatch(/^\$2[aby]\$/); // Format bcrypt
    });

    test('Le même mot de passe doit générer des hashes différents', async () => {
      const password = 'TestP@ssw0rd123';
      const hash1 = await bcrypt.hash(password, 10);
      const hash2 = await bcrypt.hash(password, 10);

      expect(hash1).not.toBe(hash2);
    });

    test('La vérification du mot de passe doit fonctionner', async () => {
      const password = 'TestP@ssw0rd123';
      const hash = await bcrypt.hash(password, 10);

      const isValid = await bcrypt.compare(password, hash);
      expect(isValid).toBe(true);
    });

    test('Un mauvais mot de passe ne doit pas passer la vérification', async () => {
      const password = 'TestP@ssw0rd123';
      const hash = await bcrypt.hash(password, 10);

      const isValid = await bcrypt.compare('WrongPassword', hash);
      expect(isValid).toBe(false);
    });

    test('Le coût de hashing doit être suffisant (>= 10)', async () => {
      const password = 'TestP@ssw0rd123';
      const hash = await bcrypt.hash(password, 10);

      // Extraire le coût du hash (caractères 5-6)
      const cost = parseInt(hash.substring(4, 6));
      expect(cost).toBeGreaterThanOrEqual(10);
    });
  });

  describe('JWT (JSON Web Tokens)', () => {
    const testPayload = {
      sub: 123,
      email: 'test@example.com',
      role: 'JOUEUR'
    };

    test('Création de token JWT', () => {
      const token = jwt.sign(testPayload, SECRET_KEY, { expiresIn: '24h' });

      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // header.payload.signature
    });

    test('Décodage de token JWT valide', () => {
      const token = jwt.sign(testPayload, SECRET_KEY, { expiresIn: '24h' });
      const decoded = jwt.verify(token, SECRET_KEY);

      expect(decoded.sub).toBe(testPayload.sub);
      expect(decoded.email).toBe(testPayload.email);
      expect(decoded.role).toBe(testPayload.role);
      expect(decoded.exp).toBeTruthy();
    });

    test('Token invalide doit lever une erreur', () => {
      const invalidToken = 'invalid.token.here';

      expect(() => {
        jwt.verify(invalidToken, SECRET_KEY);
      }).toThrow();
    });

    test('Token avec mauvaise signature doit lever une erreur', () => {
      const token = jwt.sign(testPayload, SECRET_KEY, { expiresIn: '24h' });
      const wrongSecret = 'wrong_secret_key';

      expect(() => {
        jwt.verify(token, wrongSecret);
      }).toThrow();
    });

    test('Token expiré doit lever une erreur', () => {
      const token = jwt.sign(testPayload, SECRET_KEY, { expiresIn: '-1h' });

      expect(() => {
        jwt.verify(token, SECRET_KEY);
      }).toThrow();
    });

    test('Le payload du token ne doit pas contenir de données sensibles', () => {
      const token = jwt.sign(testPayload, SECRET_KEY, { expiresIn: '24h' });
      const parts = token.split('.');
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

      // Vérifier qu'il n'y a pas de mot de passe dans le payload
      expect(payload.password).toBeUndefined();
      expect(payload.password_hash).toBeUndefined();
    });
  });

  describe('Validation des entrées', () => {
    test('Validation email - format valide', () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      expect('test@example.com').toMatch(emailRegex);
      expect('user.name@domain.co.uk').toMatch(emailRegex);
      expect('admin@localhost.localdomain').toMatch(emailRegex);
    });

    test('Validation email - format invalide', () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      expect('invalid-email').not.toMatch(emailRegex);
      expect('missing@domain').not.toMatch(emailRegex);
      expect('@nodomain.com').not.toMatch(emailRegex);
      expect('spaces in@email.com').not.toMatch(emailRegex);
    });

    test('Validation mot de passe - longueur minimale', () => {
      const isValidPassword = (password) => {
        if (!password) return false;
        return password.length >= 8;
      };

      expect(isValidPassword('Short1!')).toBe(false);
      expect(isValidPassword('LongPass123!')).toBe(true);
      expect(isValidPassword('')).toBe(false);
      expect(isValidPassword(null)).toBe(false);
    });
  });
});
