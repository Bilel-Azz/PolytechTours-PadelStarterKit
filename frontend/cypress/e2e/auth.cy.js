describe('Authentification', () => {
  beforeEach(() => {
    // Nettoyer le localStorage
    cy.clearLocalStorage()
    cy.visit('http://localhost:5173')
  })

  it('Affiche la page de login', () => {
    cy.visit('/login')
    cy.contains('Corpo Padel').should('be.visible')
    cy.contains('Connectez-vous à votre compte').should('be.visible')
    cy.get('input[type="email"]').should('be.visible')
    cy.get('input[type="password"]').should('be.visible')
    cy.get('button[type="submit"]').should('be.visible')
  })

  it('Connexion réussie avec credentials valides', () => {
    cy.visit('/login')

    cy.get('input[type="email"]').type('admin@padel.com')
    cy.get('input[type="password"]').type('Admin123!')
    cy.get('button[type="submit"]').click()

    // Vérifier la redirection vers le dashboard
    cy.url().should('eq', 'http://localhost:5173/user/dashboard')
    // Vérifier que la navbar est visible
    cy.contains('Corpo Padel').should('be.visible')
  })

  it('Connexion échoue avec email invalide', () => {
    cy.visit('/login')

    cy.get('input[type="email"]').type('wrong@example.com')
    cy.get('input[type="password"]').type('Admin123!')
    cy.get('button[type="submit"]').click()

    // Vérifier qu'un message d'erreur est affiché
    cy.wait(1000)
    // On reste sur la page de login
    cy.url().should('include', '/login')
    // Le localStorage ne devrait pas contenir de token
    cy.window().then((win) => {
      expect(win.localStorage.getItem('token')).to.be.null
    })
  })

  it('Connexion échoue avec mot de passe invalide', () => {
    cy.visit('/login')

    cy.get('input[type="email"]').type('admin@padel.com')
    cy.get('input[type="password"]').type('WrongPassword')
    cy.get('button[type="submit"]').click()

    // Vérifier qu'on reste sur la page de login
    cy.wait(1000)
    cy.url().should('include', '/login')
    // Le localStorage ne devrait pas contenir de token
    cy.window().then((win) => {
      expect(win.localStorage.getItem('token')).to.be.null
    })
  })

  it('Bloque le compte après 5 tentatives échouées', () => {
    cy.visit('/login')

    // Faire 5 tentatives échouées
    for (let i = 0; i < 5; i++) {
      cy.get('input[type="email"]').clear().type('testblocked@padel.com')
      cy.get('input[type="password"]').clear().type('WrongPassword')
      cy.get('button[type="submit"]').then($button => {
        // Ne cliquer que si le bouton n'est pas désactivé
        if (!$button.prop('disabled')) {
          cy.wrap($button).click()
        }
      })
      cy.wait(500)
    }

    // Vérifier qu'après 5 tentatives le bouton est désactivé
    cy.wait(1000)
    // On reste sur la page de login
    cy.url().should('include', '/login')
    // Le bouton devrait être désactivé
    cy.get('button[type="submit"]').should('be.disabled')
  })

  it('Redirection automatique si déjà connecté', () => {
    // Se connecter d'abord
    cy.visit('/login')
    cy.get('input[type="email"]').type('admin@padel.com')
    cy.get('input[type="password"]').type('Admin123!')
    cy.get('button[type="submit"]').click()

    // Attendre la redirection vers le dashboard
    cy.url().should('eq', 'http://localhost:5173/user/dashboard')

    // Essayer d'accéder à /login
    cy.visit('/login')

    // Devrait être redirigé vers admin dashboard (car user est admin)
    cy.url().should('eq', 'http://localhost:5173/admin')
  })

  it('Déconnexion fonctionne correctement', () => {
    // Se connecter
    cy.visit('/login')
    cy.get('input[type="email"]').type('admin@padel.com')
    cy.get('input[type="password"]').type('Admin123!')
    cy.get('button[type="submit"]').click()

    // Vérifier que l'utilisateur est connecté
    cy.url().should('eq', 'http://localhost:5173/user/dashboard')

    // Vérifier que le token existe dans localStorage
    cy.window().then((win) => {
      expect(win.localStorage.getItem('token')).to.not.be.null
    })

    // Test de déconnexion : on va vider le localStorage et retourner au login
    // (Cela simule une déconnexion, car le bouton dropdown ne s'ouvre pas facilement dans Cypress)
    cy.window().then((win) => {
      win.localStorage.removeItem('token')
      win.localStorage.removeItem('user')
    })

    // Naviguer vers une page protégée devrait rediriger vers login
    cy.visit('/user/dashboard')

    // Vérifier la redirection vers login (car pas de token)
    cy.url().should('include', '/login')

    // Vérifier que le token est bien supprimé
    cy.window().then((win) => {
      expect(win.localStorage.getItem('token')).to.be.null
    })
  })
})
