// ============================================
// FICHIER : backend/__tests__/unit/createAdmin.test.js
// Tests unitaires pour la création d'administrateur
// ============================================

const bcrypt = require('bcryptjs');
const { User } = require('../../models');

describe('Tests unitaires - Création d\'administrateur', () => {

  describe('Création d\'un administrateur via le modèle User', () => {
    test('Création d\'un admin avec des données valides', async () => {
      const email = 'admin-test@corpopadel.fr';
      const password = 'SecureP@ssw0rd123';
      const hashedPassword = await bcrypt.hash(password, 10);

      const admin = await User.create({
        email,
        password_hash: hashedPassword,
        role: 'ADMINISTRATEUR',
        is_active: true,
        must_change_password: false
      });

      expect(admin).toBeDefined();
      expect(admin.email).toBe(email);
      expect(admin.role).toBe('ADMINISTRATEUR');
      expect(admin.is_active).toBe(true);
      expect(admin.must_change_password).toBe(false);

      // Vérifier que le mot de passe est correctement hashé
      const isPasswordValid = await bcrypt.compare(password, admin.password_hash);
      expect(isPasswordValid).toBe(true);
    });

    test('Le rôle admin doit être ADMINISTRATEUR', async () => {
      const admin = await User.create({
        email: 'admin-role-test@corpopadel.fr',
        password_hash: await bcrypt.hash('TestP@ss123', 10),
        role: 'ADMINISTRATEUR',
        is_active: true
      });

      expect(admin.role).toBe('ADMINISTRATEUR');
      expect(admin.role).not.toBe('JOUEUR');
    });

    test('Le hash du mot de passe admin doit être sécurisé', async () => {
      const password = 'AdminSecureP@ss123';
      const hashedPassword = await bcrypt.hash(password, 10);

      // Le hash ne doit pas être identique au mot de passe
      expect(hashedPassword).not.toBe(password);

      // Le hash doit commencer par $2 (bcrypt)
      expect(hashedPassword.startsWith('$2')).toBe(true);

      // Le hash doit avoir la bonne longueur
      expect(hashedPassword.length).toBeGreaterThan(50);
    });

    test('Email admin doit être unique', async () => {
      const email = 'unique-admin@corpopadel.fr';
      const hashedPassword = await bcrypt.hash('TestP@ss123', 10);

      // Créer le premier admin
      await User.create({
        email,
        password_hash: hashedPassword,
        role: 'ADMINISTRATEUR',
        is_active: true
      });

      // Tenter de créer un deuxième admin avec le même email
      await expect(
        User.create({
          email,
          password_hash: hashedPassword,
          role: 'ADMINISTRATEUR',
          is_active: true
        })
      ).rejects.toThrow();
    });

    test('Admin peut être désactivé', async () => {
      const admin = await User.create({
        email: 'inactive-admin@corpopadel.fr',
        password_hash: await bcrypt.hash('TestP@ss123', 10),
        role: 'ADMINISTRATEUR',
        is_active: false
      });

      expect(admin.is_active).toBe(false);
    });
  });

  describe('Validation des données admin', () => {
    test('Email requis pour créer un admin', async () => {
      await expect(
        User.create({
          password_hash: await bcrypt.hash('TestP@ss123', 10),
          role: 'ADMINISTRATEUR',
          is_active: true
        })
      ).rejects.toThrow();
    });

    test('Password hash requis pour créer un admin', async () => {
      await expect(
        User.create({
          email: 'no-password@corpopadel.fr',
          role: 'ADMINISTRATEUR',
          is_active: true
        })
      ).rejects.toThrow();
    });

    test('Rôle requis pour créer un admin', async () => {
      await expect(
        User.create({
          email: 'no-role@corpopadel.fr',
          password_hash: await bcrypt.hash('TestP@ss123', 10),
          is_active: true
        })
      ).rejects.toThrow();
    });
  });
});
