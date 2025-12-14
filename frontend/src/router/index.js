// ============================================
// FICHIER : frontend/src/router/index.js
// ============================================

import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import MainLayout from '../layouts/MainLayout.vue'
import HomePage from '../views/HomePage.vue'
import LoginPage from '../views/LoginPage.vue'
import SignupPage from '../views/SignupPage.vue'
import AdminDashboard from '../views/admin/AdminDashboard.vue'
import AdminHome from '../views/admin/AdminHome.vue'
import PlayersManagement from '../views/admin/PlayersManagement.vue'
import TeamsManagement from '../views/admin/TeamsManagement.vue'
import PoolsManagement from '../views/admin/PoolsManagement.vue'
import MatchesManagement from '../views/admin/MatchesManagement.vue'
import EventsManagement from '../views/admin/EventsManagement.vue'
import UsersManagement from '../views/admin/UsersManagement.vue'

// Pages utilisateur
import UserDashboard from '../views/UserDashboard.vue'
import MatchsPage from '../views/MatchsPage.vue'
import ResultsPage from '../views/ResultsPage.vue'
import ProfilePage from '../views/ProfilePage.vue'
import RankingsPage from '../views/RankingsPage.vue'
import CalendarPage from '../views/CalendarPage.vue'

const routes = [
  // Page d'accueil publique (sans layout)
  {
    path: '/',
    name: 'home',
    component: HomePage,
    meta: { requiresAuth: false }
  },

  // Routes d'authentification (sans layout)
  {
    path: '/login',
    name: 'login',
    component: LoginPage,
    meta: { requiresAuth: false }
  },
  {
    path: '/signup',
    name: 'signup',
    component: SignupPage,
    meta: { requiresAuth: false }
  },

  // Routes utilisateur connecté (avec MainLayout)
  {
    path: '/user',
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/user/dashboard'
      },
      {
        path: 'dashboard',
        name: 'user-dashboard',
        component: UserDashboard,
        meta: { title: 'Tableau de bord' }
      },
      {
        path: 'matches',
        name: 'user-matches',
        component: MatchsPage,
        meta: { title: 'Mes Matchs' }
      },
      {
        path: 'results',
        name: 'user-results',
        component: ResultsPage,
        meta: { title: 'Mes Résultats' }
      },
      {
        path: 'profile',
        name: 'user-profile',
        component: ProfilePage,
        meta: { title: 'Mon Profil' }
      },
      {
        path: 'rankings',
        name: 'user-rankings',
        component: RankingsPage,
        meta: { title: 'Classement' }
      },
      {
        path: 'calendar',
        name: 'user-calendar',
        component: CalendarPage,
        meta: { title: 'Planning' }
      }
    ]
  },

  // Routes Admin (avec AdminDashboard layout)
  {
    path: '/admin',
    component: AdminDashboard,
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      {
        path: '',
        name: 'admin-home',
        component: AdminHome
      },
      {
        path: 'players',
        name: 'admin-players',
        component: PlayersManagement
      },
      {
        path: 'teams',
        name: 'admin-teams',
        component: TeamsManagement
      },
      {
        path: 'pools',
        name: 'admin-pools',
        component: PoolsManagement
      },
      {
        path: 'matches',
        name: 'admin-matches',
        component: MatchesManagement
      },
      {
        path: 'events',
        name: 'admin-events',
        component: EventsManagement
      },
      {
        path: 'users',
        name: 'admin-users',
        component: UsersManagement
      }
    ]
  },

  // Redirect legacy routes
  {
    path: '/planning',
    redirect: '/user/calendar'
  },
  {
    path: '/matchs',
    redirect: '/user/matches'
  },
  {
    path: '/results',
    redirect: '/user/results'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guard pour protéger les routes
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  // Charger l'auth depuis le localStorage au démarrage
  if (!authStore.isAuthenticated && !authStore.user) {
    authStore.checkAuth()
  }

  // Si la route nécessite une authentification
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next('/login')
  }

  // Si la route nécessite un rôle admin
  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    return next('/user/dashboard')
  }

  // Si l'utilisateur est connecté et essaie d'aller sur login/signup
  if (authStore.isAuthenticated && (to.path === '/login' || to.path === '/signup')) {
    if (authStore.isAdmin) {
      return next('/admin')
    } else {
      return next('/user/dashboard')
    }
  }

  next()
})

export default router
