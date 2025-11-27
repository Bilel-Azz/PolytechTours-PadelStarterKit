// ============================================
// FICHIER : frontend/src/router/index.js
// ============================================

import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import HomePage from '../views/HomePage.vue'
import LoginPage from '../views/LoginPage.vue'
import PlanningPage from '../views/PlanningPage.vue'
import MatchsPage from '../views/MatchsPage.vue'
import ResultsPage from '../views/ResultsPage.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomePage,
    meta: { requiresAuth: false }
  },
  {
    path: '/login',
    name: 'login',
    component: LoginPage,
    meta: { requiresAuth: false }
  },
  {
    path: '/planning',
    name: 'planning',
    component: PlanningPage,
    meta: { requiresAuth: false }
  },
  {
    path: '/matches',
    name: 'matches',
    component: MatchsPage,
    meta: { requiresAuth: false }
  },
  {
    path: '/results',
    name: 'results',
    component: ResultsPage,
    meta: { requiresAuth: false }
  },
  // Routes temporaires - à implémenter
  {
    path: '/admin',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guard pour protéger les routes
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  console.log('[ROUTER] Navigation guard')
  console.log('[ROUTER] From:', from.path, '→ To:', to.path)
  console.log('[ROUTER] isAuthenticated:', authStore.isAuthenticated)
  console.log('[ROUTER] requiresAuth:', to.meta.requiresAuth)

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    console.log('[ROUTER] Redirecting to login (protected route)')
    next('/login')
  } else if (to.path === '/login' && authStore.isAuthenticated) {
    console.log('[ROUTER] Redirecting to home (already authenticated)')
    next('/')
  } else {
    console.log('[ROUTER] Allowing navigation')
    next()
  }
})

export default router
