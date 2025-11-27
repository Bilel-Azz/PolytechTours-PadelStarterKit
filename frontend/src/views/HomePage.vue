<script setup>
import { useAuthStore } from '../stores/auth'
import { Calendar, Trophy, BarChart3, Shield, LogIn } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import Button from '../components/ui/button.vue'
import Card from '../components/ui/card.vue'

const authStore = useAuthStore()
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">
    <div class="max-w-4xl mx-auto text-center space-y-8">
      <!-- Hero Section -->
      <div class="space-y-4">
        <div class="flex justify-center">
          <div class="relative">
            <div class="absolute inset-0 bg-primary/20 blur-3xl rounded-full"></div>
            <div class="relative w-32 h-32 mx-auto bg-primary rounded-full flex items-center justify-center text-white text-7xl">
              🎾
            </div>
          </div>
        </div>

        <h1 class="text-5xl font-bold tracking-tight">
          Bienvenue sur Corpo Padel
        </h1>

        <p class="text-xl text-muted-foreground max-w-2xl mx-auto">
          Gérez vos tournois corporatifs de padel en toute simplicité
        </p>
      </div>

      <!-- Not Authenticated -->
      <div v-if="!authStore.isAuthenticated" class="space-y-6">
        <Card class="p-8 max-w-md mx-auto">
          <p class="text-muted-foreground mb-6">
            Connectez-vous pour accéder à votre planning, vos matchs et vos résultats
          </p>
          <RouterLink to="/login">
            <Button size="lg" class="w-full gap-2">
              <LogIn class="h-5 w-5" />
              Se connecter
            </Button>
          </RouterLink>
        </Card>
      </div>

      <!-- Authenticated -->
      <div v-else class="space-y-8">
        <Card class="p-6">
          <p class="text-xl">
            Bonjour <span class="font-semibold text-primary">{{ authStore.user?.email }}</span> !
          </p>
        </Card>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <RouterLink to="/planning" class="group">
            <Card class="p-6 h-full transition-all hover:shadow-lg hover:scale-105">
              <div class="flex flex-col items-center text-center space-y-3">
                <div class="p-3 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Calendar class="h-8 w-8" />
                </div>
                <h3 class="text-xl font-semibold">Planning</h3>
                <p class="text-sm text-muted-foreground">Consultez vos prochains matchs</p>
              </div>
            </Card>
          </RouterLink>

          <RouterLink to="/matches" class="group">
            <Card class="p-6 h-full transition-all hover:shadow-lg hover:scale-105">
              <div class="flex flex-col items-center text-center space-y-3">
                <div class="p-3 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Trophy class="h-8 w-8" />
                </div>
                <h3 class="text-xl font-semibold">Matchs</h3>
                <p class="text-sm text-muted-foreground">Suivez vos rencontres</p>
              </div>
            </Card>
          </RouterLink>

          <RouterLink to="/results" class="group">
            <Card class="p-6 h-full transition-all hover:shadow-lg hover:scale-105">
              <div class="flex flex-col items-center text-center space-y-3">
                <div class="p-3 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <BarChart3 class="h-8 w-8" />
                </div>
                <h3 class="text-xl font-semibold">Résultats</h3>
                <p class="text-sm text-muted-foreground">Classement et statistiques</p>
              </div>
            </Card>
          </RouterLink>
        </div>

        <div v-if="authStore.isAdmin">
          <RouterLink to="/admin">
            <Button variant="secondary" size="lg" class="gap-2">
              <Shield class="h-5 w-5" />
              Accéder à l'administration
            </Button>
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>
