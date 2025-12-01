// ============================================
// FICHIER : frontend/src/router/index.js
// ============================================

import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import MainLayout from '../layouts/MainLayout.vue'
import HomePage from '../views/HomePage.vue'
import LoginPage from '../views/LoginPage.vue'
import SignupPage from '../views/SignupPage.vue'
import PlanningPage from '../views/PlanningPage.vue'
import MatchsPage from '../views/MatchsPage.vue'
import ResultsPage from '../views/ResultsPage.vue'
import AdminDashboard from '../views/admin/AdminDashboard.vue'
import AdminHome from '../views/admin/AdminHome.vue'
import PlayersManagement from '../views/admin/PlayersManagement.vue'
import TeamsManagement from '../views/admin/TeamsManagement.vue'
import PoolsManagement from '../views/admin/PoolsManagement.vue'

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
    meta: { requiresAuth: true, requiresUser: true },
    children: [
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
        path: 'planning',
        name: 'admin-planning',
        component: PlanningPage
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
      }
    ]
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
    return next('/user/matches')
  }

  // Si la route nécessite un rôle utilisateur (pas admin)
  if (to.meta.requiresUser && authStore.isAdmin) {
    return next('/admin')
  }

  // Si l'utilisateur est connecté et essaie d'aller sur login/signup
  if (authStore.isAuthenticated && (to.path === '/login' || to.path === '/signup')) {
    if (authStore.isAdmin) {
      return next('/admin')
    } else {
      return next('/user/matches')
    }
  }

  next()
})

export default router
