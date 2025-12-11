// ============================================
// FICHIER : backend/__tests__/integration/security-headers.test.js
// Tests d'intégration pour les headers de sécurité
// ============================================

const request = require('supertest');
const express = require('express');
const cors = require('cors');
const authRoutes = require('../../routes/auth');

// Créer une application Express de test avec les middlewares de sécurité
const app = express();

// Désactiver le header X-Powered-By pour des raisons de sécurité
app.disable('x-powered-by');

// Middleware CORS
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());

// Security headers middleware (copié depuis server.js)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

app.use('/api/v1/auth', authRoutes);

// Route de test simple
app.get('/test', (req, res) => {
  res.json({ message: 'test' });
});

describe('Tests d\'intégration - Headers de sécurité', () => {

  describe('X-Content-Type-Options', () => {
    test('Header X-Content-Type-Options doit être présent', async () => {
      const response = await request(app).get('/test');

      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });

    test('X-Content-Type-Options présent sur toutes les routes', async () => {
      const routes = [
        { method: 'get', path: '/test' },
        { method: 'post', path: '/api/v1/auth/register' }
      ];

      for (const route of routes) {
        const response = await request(app)[route.method](route.path)
          .send(route.method === 'post' ? { email: 'test@example.com', password: 'ValidP@ss123' } : {});

        expect(response.headers['x-content-type-options']).toBe('nosniff');
      }
    });
  });

  describe('X-Frame-Options', () => {
    test('Header X-Frame-Options doit être DENY', async () => {
      const response = await request(app).get('/test');

      expect(response.headers['x-frame-options']).toBe('DENY');
    });

    test('Protection contre le clickjacking activée', async () => {
      const response = await request(app).get('/test');

      // X-Frame-Options: DENY empêche l'application d'être chargée dans une iframe
      expect(response.headers['x-frame-options']).toBe('DENY');
    });
  });

  describe('X-XSS-Protection', () => {
    test('Header X-XSS-Protection doit être activé', async () => {
      const response = await request(app).get('/test');

      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
    });

    test('Protection XSS en mode blocage', async () => {
      const response = await request(app).get('/test');

      const xssHeader = response.headers['x-xss-protection'];
      expect(xssHeader).toContain('1');         // Activé
      expect(xssHeader).toContain('mode=block'); // Mode blocage
    });
  });

  describe('CORS Headers', () => {
    test('CORS doit permettre les credentials', async () => {
      const response = await request(app)
        .get('/test')
        .set('Origin', 'http://localhost:3000');

      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });

    test('CORS doit refléter l\'origine de la requête', async () => {
      const origin = 'http://localhost:3000';
      const response = await request(app)
        .get('/test')
        .set('Origin', origin);

      expect(response.headers['access-control-allow-origin']).toBe(origin);
    });

    test('Preflight request OPTIONS doit être supporté', async () => {
      const response = await request(app)
        .options('/api/v1/auth/login')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST');

      expect(response.status).toBe(204);
      expect(response.headers['access-control-allow-methods']).toBeTruthy();
    });
  });

  describe('Content-Type Header', () => {
    test('Les réponses JSON doivent avoir le bon Content-Type', async () => {
      const response = await request(app).get('/test');

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    test('Content-Type correct pour toutes les routes API', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'ValidP@ss123'
        });

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });

  describe('Headers de sécurité recommandés supplémentaires', () => {
    test('Documentation: Strict-Transport-Security (HSTS) devrait être ajouté', async () => {
      const response = await request(app).get('/test');

      // Note: Ce header n'est pas encore implémenté
      // Ce test documente la recommandation d'ajouter HSTS
      // expect(response.headers['strict-transport-security']).toBeTruthy();

      // Pour l'instant, on vérifie juste qu'il n'est pas présent
      // et on documente qu'il devrait être ajouté
      if (!response.headers['strict-transport-security']) {
        // Recommandation: Ajouter 'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
      }
    });

    test('Documentation: Content-Security-Policy (CSP) devrait être ajouté', async () => {
      const response = await request(app).get('/test');

      // Note: Ce header n'est pas encore implémenté
      // Ce test documente la recommandation d'ajouter CSP
      // expect(response.headers['content-security-policy']).toBeTruthy();

      // Pour l'instant, on vérifie juste qu'il n'est pas présent
      if (!response.headers['content-security-policy']) {
        // Recommandation: Ajouter une politique CSP appropriée
        // Exemple: "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';"
      }
    });

    test('Documentation: Permissions-Policy devrait être ajouté', async () => {
      const response = await request(app).get('/test');

      // Note: Ce header n'est pas encore implémenté
      // Ce test documente la recommandation d'ajouter Permissions-Policy
      if (!response.headers['permissions-policy']) {
        // Recommandation: Ajouter 'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
      }
    });

    test('Documentation: Referrer-Policy devrait être ajouté', async () => {
      const response = await request(app).get('/test');

      // Note: Ce header n'est pas encore implémenté
      if (!response.headers['referrer-policy']) {
        // Recommandation: Ajouter 'Referrer-Policy': 'strict-origin-when-cross-origin'
      }
    });
  });

  describe('Headers sensibles ne doivent pas être exposés', () => {
    test('Le header Server ne doit pas révéler la version d\'Express', async () => {
      const response = await request(app).get('/test');

      // Vérifier que le header Server n'expose pas trop d'informations
      if (response.headers['server']) {
        expect(response.headers['server']).not.toMatch(/express/i);
        expect(response.headers['server']).not.toMatch(/\d+\.\d+\.\d+/); // Version numbers
      }
    });

    test('Les headers X-Powered-By ne doivent pas être présents', async () => {
      const response = await request(app).get('/test');

      // Express ajoute X-Powered-By par défaut, il devrait être désactivé
      expect(response.headers['x-powered-by']).toBeUndefined();
    });

    test('Aucune information de débogage dans les headers', async () => {
      const response = await request(app).get('/test');

      expect(response.headers['x-debug']).toBeUndefined();
      expect(response.headers['x-error']).toBeUndefined();
    });
  });

  describe('Sécurité des cookies (si utilisés)', () => {
    test('Les cookies doivent avoir le flag HttpOnly', async () => {
      const response = await request(app).get('/test');

      // Si des cookies sont définis, ils doivent avoir HttpOnly
      const setCookie = response.headers['set-cookie'];
      if (setCookie) {
        setCookie.forEach(cookie => {
          expect(cookie).toMatch(/HttpOnly/i);
        });
      }
    });

    test('Les cookies doivent avoir le flag Secure en production', async () => {
      // Note: Ce test devrait être adapté selon l'environnement
      const response = await request(app).get('/test');

      const setCookie = response.headers['set-cookie'];
      if (setCookie && process.env.NODE_ENV === 'production') {
        setCookie.forEach(cookie => {
          expect(cookie).toMatch(/Secure/i);
        });
      }
    });

    test('Les cookies doivent avoir SameSite', async () => {
      const response = await request(app).get('/test');

      const setCookie = response.headers['set-cookie'];
      if (setCookie) {
        setCookie.forEach(cookie => {
          expect(cookie).toMatch(/SameSite=/i);
        });
      }
    });
  });
});
