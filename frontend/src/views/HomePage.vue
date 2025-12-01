<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { LogIn } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import Button from '../components/ui/button.vue'
import Card from '../components/ui/card.vue'

const router = useRouter()
const authStore = useAuthStore()

// Rediriger automatiquement si connecté
onMounted(() => {
  authStore.checkAuth()

  if (authStore.isAuthenticated) {
    if (authStore.isAdmin) {
      router.push('/admin')
    } else {
      router.push('/user/matches')
    }
  }
})
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
      <div class="space-y-6">
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
          <div class="mt-4 text-center text-sm">
            <span class="text-muted-foreground">Pas encore de compte ?</span>
            <RouterLink to="/signup" class="ml-1 text-primary hover:underline">
              Créer un compte
            </RouterLink>
          </div>
        </Card>
      </div>
    </div>
  </div>
</template>
