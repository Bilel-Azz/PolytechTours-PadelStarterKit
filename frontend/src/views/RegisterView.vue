<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const error = ref('')

const handleRegister = async () => {
  error.value = ''
  
  // Validation côté client
  if (!email.value || !password.value) {
    error.value = 'Tous les champs sont requis'
    return
  }
  
  if (password.value.length < 8) {
    error.value = 'Le mot de passe doit contenir au moins 8 caractères'
    return
  }
  
  if (password.value !== confirmPassword.value) {
    error.value = 'Les mots de passe ne correspondent pas'
    return
  }
  
  const result = await authStore.register(email.value, password.value)
  
  if (result.success) {
    router.push('/')
  } else {
    error.value = result.error
  }
}
</script>

<template>
  <div class="flex min-h-[80vh] flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <h2 class="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">Créer un compte</h2>
      <p class="mt-2 text-center text-sm text-gray-600">
        Rejoignez la communauté Corpo Padel
      </p>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
        <form class="space-y-6" @submit.prevent="handleRegister">
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
            <div class="mt-1">
              <input 
                id="email" 
                v-model="email" 
                name="email" 
                type="email" 
                autocomplete="email" 
                required 
                class="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-gray-700">Mot de passe</label>
            <div class="mt-1">
              <input 
                id="password" 
                v-model="password" 
                name="password" 
                type="password" 
                autocomplete="new-password" 
                required 
                class="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <p class="mt-1 text-xs text-gray-500">Minimum 8 caractères</p>
          </div>

          <div>
            <label for="confirmPassword" class="block text-sm font-medium text-gray-700">Confirmer le mot de passe</label>
            <div class="mt-1">
              <input 
                id="confirmPassword" 
                v-model="confirmPassword" 
                name="confirmPassword" 
                type="password" 
                autocomplete="new-password" 
                required 
                class="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          <div v-if="error" class="rounded-md bg-red-50 p-4">
            <div class="flex">
              <div class="ml-3">
                <h3 class="text-sm font-medium text-red-800">{{ error }}</h3>
              </div>
            </div>
          </div>

          <div>
            <button 
              type="submit" 
              :disabled="authStore.loading"
              class="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="authStore.loading">Inscription...</span>
              <span v-else>S'inscrire</span>
            </button>
          </div>

          <div class="text-center text-sm">
            <span class="text-gray-600">Vous avez déjà un compte ? </span>
            <router-link to="/login" class="font-medium text-indigo-600 hover:text-indigo-500">
              Se connecter
            </router-link>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
