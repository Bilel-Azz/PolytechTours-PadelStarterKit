<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { Mail, Lock, AlertCircle, Info } from 'lucide-vue-next'
import Button from '../components/ui/button.vue'
import Card from '../components/ui/card.vue'
import Input from '../components/ui/input.vue'
import Label from '../components/ui/label.vue'
import Alert from '../components/ui/alert.vue'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')
const attemptsRemaining = ref(null)
const minutesRemaining = ref(null)

const handleLogin = async () => {
  loading.value = true
  errorMessage.value = ''
  attemptsRemaining.value = null
  minutesRemaining.value = null

  console.log('[LOGIN] Submitting login form')
  console.log('[LOGIN] Email:', email.value)

  const result = await authStore.login(email.value, password.value)

  console.log('[LOGIN] Login result:', result)

  if (result.success) {
    console.log('[LOGIN] Login successful, redirecting to home...')
    await router.push('/')
    console.log('[LOGIN] Navigation complete')
  } else {
    console.log('[LOGIN] Login failed:', result.error)
    errorMessage.value = result.error || 'Erreur de connexion'
    attemptsRemaining.value = result.attemptsRemaining ?? null
    minutesRemaining.value = result.minutesRemaining ?? null
  }

  loading.value = false
}
</script>

<template>
  <div class="flex items-center justify-center min-h-[calc(100vh-8rem)]">
    <div class="w-full max-w-md">
      <Card class="p-8">
        <!-- Header -->
        <div class="text-center mb-8 space-y-2">
          <div class="flex justify-center mb-4">
            <div class="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-5xl">
              🎾
            </div>
          </div>
          <h1 class="text-3xl font-bold tracking-tight">Corpo Padel</h1>
          <p class="text-muted-foreground">Connectez-vous à votre compte</p>
        </div>

        <!-- Formulaire -->
        <form @submit.prevent="handleLogin" class="space-y-6">
          <!-- Email -->
          <div class="space-y-2">
            <Label for="email">Email</Label>
            <div class="relative">
              <Mail class="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                v-model="email"
                type="email"
                required
                placeholder="votre@email.com"
                class="pl-10"
              />
            </div>
          </div>

          <!-- Mot de passe -->
          <div class="space-y-2">
            <Label for="password">Mot de passe</Label>
            <div class="relative">
              <Lock class="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                v-model="password"
                type="password"
                required
                placeholder="••••••••"
                class="pl-10"
              />
            </div>
          </div>

          <!-- Message d'erreur -->
          <Alert v-if="errorMessage" variant="destructive" class="flex items-start gap-3">
            <AlertCircle class="h-5 w-5 mt-0.5" />
            <div class="flex-1 space-y-1">
              <p class="text-sm font-medium">{{ errorMessage }}</p>
              <p v-if="attemptsRemaining !== null" class="text-sm">
                Tentatives restantes : {{ attemptsRemaining }}
              </p>
              <p v-if="minutesRemaining !== null" class="text-sm">
                Compte bloqué pendant {{ minutesRemaining }} minutes
              </p>
            </div>
          </Alert>

          <!-- Bouton de connexion -->
          <Button
            type="submit"
            :disabled="loading || minutesRemaining !== null"
            class="w-full"
            size="lg"
          >
            <span v-if="loading">Connexion...</span>
            <span v-else-if="minutesRemaining !== null">Compte bloqué</span>
            <span v-else>Se connecter</span>
          </Button>
        </form>

        <!-- Informations de test -->
        <Alert class="mt-6 flex items-start gap-3">
          <Info class="h-5 w-5 mt-0.5 text-primary" />
          <div class="flex-1">
            <p class="text-sm font-medium mb-1">Compte de test</p>
            <p class="text-xs text-muted-foreground">
              admin@padel.com / Admin@2025!
            </p>
          </div>
        </Alert>
      </Card>
    </div>
  </div>
</template>
