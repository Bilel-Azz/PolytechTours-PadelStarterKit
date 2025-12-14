<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-vue-next'
import Button from '../components/ui/button.vue'
import Card from '../components/ui/card.vue'
import Input from '../components/ui/input.vue'
import Label from '../components/ui/label.vue'
import Alert from '../components/ui/alert.vue'
import { authAPI } from '../services/api'

const router = useRouter()

const formData = ref({
  email: '',
  password: '',
  confirmPassword: '',
  firstName: '',
  lastName: ''
})

const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const handleSignup = async () => {
  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  // Validation frontend
  if (formData.value.password !== formData.value.confirmPassword) {
    errorMessage.value = 'Les mots de passe ne correspondent pas'
    loading.value = false
    return
  }

  if (formData.value.password.length < 8) {
    errorMessage.value = 'Le mot de passe doit contenir au moins 8 caractères'
    loading.value = false
    return
  }

  try {
    const response = await authAPI.register(formData.value.email, formData.value.password)

    // Stocker le token et les infos utilisateur
    localStorage.setItem('token', response.data.access_token)
    localStorage.setItem('user', JSON.stringify(response.data.user))

    successMessage.value = 'Compte créé avec succès ! Redirection...'

    // Rediriger vers la page appropriée selon le rôle
    setTimeout(() => {
      if (response.data.user.role === 'ADMINISTRATEUR') {
        router.push('/admin')
      } else {
        router.push('/user/matches')
      }
    }, 1500)
  } catch (error) {
    if (error.response?.data?.detail) {
      errorMessage.value = error.response.data.detail
    } else {
      errorMessage.value = 'Erreur lors de la création du compte'
    }
    loading.value = false
  }
}
</script>

<template>
  <div class="flex items-center justify-center min-h-[calc(100vh-8rem)] py-8">
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
          <p class="text-muted-foreground">Créez votre compte</p>
        </div>

        <!-- Formulaire -->
        <form @submit.prevent="handleSignup" class="space-y-5">
          <!-- Nom et Prénom -->
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="firstName">Prénom</Label>
              <div class="relative">
                <User class="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="firstName"
                  v-model="formData.firstName"
                  type="text"
                  required
                  placeholder="Jean"
                  class="pl-10"
                />
              </div>
            </div>

            <div class="space-y-2">
              <Label for="lastName">Nom</Label>
              <div class="relative">
                <User class="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="lastName"
                  v-model="formData.lastName"
                  type="text"
                  required
                  placeholder="Dupont"
                  class="pl-10"
                />
              </div>
            </div>
          </div>

          <!-- Email -->
          <div class="space-y-2">
            <Label for="email">Email</Label>
            <div class="relative">
              <Mail class="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                v-model="formData.email"
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
                v-model="formData.password"
                type="password"
                required
                placeholder="••••••••"
                class="pl-10"
              />
            </div>
            <p class="text-xs text-muted-foreground">
              Minimum 8 caractères
            </p>
          </div>

          <!-- Confirmation mot de passe -->
          <div class="space-y-2">
            <Label for="confirmPassword">Confirmer le mot de passe</Label>
            <div class="relative">
              <Lock class="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                v-model="formData.confirmPassword"
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
            <div class="flex-1">
              <p class="text-sm font-medium">{{ errorMessage }}</p>
            </div>
          </Alert>

          <!-- Message de succès -->
          <Alert v-if="successMessage" class="flex items-start gap-3 border-green-500 bg-green-50 dark:bg-green-950/20">
            <CheckCircle class="h-5 w-5 mt-0.5 text-green-600" />
            <div class="flex-1">
              <p class="text-sm font-medium text-green-800 dark:text-green-400">{{ successMessage }}</p>
            </div>
          </Alert>

          <!-- Bouton d'inscription -->
          <Button
            type="submit"
            :disabled="loading"
            class="w-full"
            size="lg"
          >
            <span v-if="loading">Création du compte...</span>
            <span v-else>Créer mon compte</span>
          </Button>
        </form>

        <!-- Lien vers login -->
        <div class="mt-6 text-center text-sm">
          <span class="text-muted-foreground">Vous avez déjà un compte ?</span>
          <Button
            variant="link"
            class="ml-1 p-0 h-auto"
            @click="router.push('/login')"
          >
            Se connecter
          </Button>
        </div>
      </Card>
    </div>
  </div>
</template>
