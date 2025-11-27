<script setup>
import { RouterView, useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'
import { Home, Calendar, Trophy, BarChart3, LogIn, LogOut, User } from 'lucide-vue-next'
import Button from './components/ui/button.vue'
import Avatar from './components/ui/avatar.vue'

const router = useRouter()
const authStore = useAuthStore()

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen bg-background">
    <header class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div class="max-w-7xl mx-auto flex h-16 items-center px-4 sm:px-6 lg:px-8">
        <div class="flex items-center gap-2">
          <span class="text-2xl">🎾</span>
          <h1 class="text-xl font-bold">Corpo Padel</h1>
        </div>

        <nav class="flex flex-1 items-center justify-center gap-6">
          <RouterLink
            to="/"
            class="inline-flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary"
            active-class="text-primary"
          >
            <Home class="h-4 w-4" />
            Accueil
          </RouterLink>
          <RouterLink
            to="/planning"
            class="inline-flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary"
            active-class="text-primary"
          >
            <Calendar class="h-4 w-4" />
            Planning
          </RouterLink>
          <RouterLink
            to="/matches"
            class="inline-flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary"
            active-class="text-primary"
          >
            <Trophy class="h-4 w-4" />
            Matchs
          </RouterLink>
          <RouterLink
            to="/results"
            class="inline-flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary"
            active-class="text-primary"
          >
            <BarChart3 class="h-4 w-4" />
            Résultats
          </RouterLink>
        </nav>

        <div v-if="authStore.isAuthenticated" class="flex items-center gap-4">
          <div class="flex items-center gap-2">
            <Avatar class="h-8 w-8">
              <User class="h-4 w-4" />
            </Avatar>
            <span class="text-sm font-medium">{{ authStore.user?.email }}</span>
          </div>
          <Button variant="ghost" size="sm" @click="handleLogout" class="gap-2">
            <LogOut class="h-4 w-4" />
            Déconnexion
          </Button>
        </div>
        <div v-else>
          <RouterLink to="/login">
            <Button variant="default" size="sm" class="gap-2">
              <LogIn class="h-4 w-4" />
              Connexion
            </Button>
          </RouterLink>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <RouterView />
    </main>
  </div>
</template>
