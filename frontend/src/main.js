// ============================================
// FICHIER : frontend/src/main.js
// ============================================

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import './assets/main.css'

const app = createApp(App)

const pinia = createPinia()
app.use(pinia)

// Initialize auth store and check for existing session
const authStore = useAuthStore()
authStore.checkAuth()
console.log('[MAIN] App initialized, isAuthenticated:', authStore.isAuthenticated)

app.use(router)

app.mount('#app')
