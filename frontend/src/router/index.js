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

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if (to.path === '/login' && authStore.isAuthenticated) {
    next('/')
  } else {
    next()
  }
})

export default router
