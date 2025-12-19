// Configuration des intercepts API pour mocker les appels backend
Cypress.Commands.add('setupApiMocks', () => {
  // Mock successful login
  cy.intercept('POST', '**/api/v1/auth/login', (req) => {
    const { email, password } = req.body

    if (email === 'admin@padel.com' && password === 'Admin123!') {
      req.reply({
        statusCode: 200,
        body: {
          access_token: 'mock_token_admin',
          user: {
            id: 1,
            email: 'admin@padel.com',
            role: 'ADMINISTRATEUR',
            firstName: 'Admin',
            lastName: 'User'
          }
        }
      })
    } else {
      // Track failed attempts
      const failedAttempts = Cypress.env('failedAttempts') || 0
      Cypress.env('failedAttempts', failedAttempts + 1)

      if (failedAttempts >= 4) {
        // Account blocked after 5 attempts
        req.reply({
          statusCode: 403,
          body: {
            detail: {
              message: 'Compte bloqué',
              minutes_remaining: 15
            }
          }
        })
      } else {
        // Invalid credentials
        req.reply({
          statusCode: 401,
          body: {
            detail: {
              message: 'Email ou mot de passe incorrect',
              attempts_remaining: 4 - failedAttempts
            }
          }
        })
      }
    }
  }).as('loginRequest')

  // Mock logout
  cy.intercept('POST', '**/api/v1/auth/logout', {
    statusCode: 200,
    body: { message: 'Déconnexion réussie' }
  }).as('logoutRequest')
})

// Commande pour réinitialiser les compteurs de tentatives
Cypress.Commands.add('resetFailedAttempts', () => {
  Cypress.env('failedAttempts', 0)
})

// Commande personnalisée pour se connecter via l'UI
Cypress.Commands.add('login', (email, password) => {
  cy.visit('/login')
  cy.get('input[type="email"]').type(email)
  cy.get('input[type="password"]').type(password)
  cy.get('button[type="submit"]').click()
})

// Commande pour se connecter en tant qu'admin
Cypress.Commands.add('loginAsAdmin', () => {
  cy.login('admin@padel.com', 'Admin123!')
})

// Commande pour vérifier qu'une route est protégée
Cypress.Commands.add('checkProtectedRoute', (route) => {
  cy.clearLocalStorage()
  cy.visit(route)
  cy.url().should('include', '/login')
})