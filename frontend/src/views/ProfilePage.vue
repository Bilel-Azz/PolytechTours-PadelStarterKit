<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { User, Mail, Building2, Users, Trophy, Calendar, Edit, Save, X, Lock, Shield, Award } from 'lucide-vue-next'
import Card from '../components/ui/card.vue'
import Badge from '../components/ui/badge.vue'
import Button from '../components/ui/button.vue'
import Input from '../components/ui/input.vue'
import Label from '../components/ui/label.vue'
import Separator from '../components/ui/separator.vue'
import Dialog from '../components/ui/dialog.vue'
import DialogTrigger from '../components/ui/dialog/DialogTrigger.vue'
import DialogContent from '../components/ui/dialog/DialogContent.vue'
import DialogHeader from '../components/ui/dialog/DialogHeader.vue'
import DialogTitle from '../components/ui/dialog/DialogTitle.vue'
import DialogDescription from '../components/ui/dialog/DialogDescription.vue'
import DialogFooter from '../components/ui/dialog/DialogFooter.vue'
import { profileAPI, playersAPI, teamsAPI, authAPI } from '@/services/api'
import { useToast } from '@/composables/useToast'

const authStore = useAuthStore()
const { toast } = useToast()

const loading = ref(false)
const showPasswordDialog = ref(false)

// Données du profil
const profile = ref({
  email: '',
  role: '',
  created_at: null,
  player: null,
  team: null
})

// Formulaire de changement de mot de passe
const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// Charger le profil complet
const loadProfile = async () => {
  try {
    loading.value = true

    // Infos de base depuis le store
    profile.value.email = authStore.user?.email || ''
    profile.value.role = authStore.user?.role || 'JOUEUR'

    // Récupérer le profil API si disponible
    try {
      const profileResponse = await profileAPI.get()
      const profileData = profileResponse.data.data || profileResponse.data

      if (profileData.player) {
        profile.value.player = profileData.player
        profile.value.created_at = profileData.created_at
      }
    } catch (e) {
      // Si le profil API n'est pas disponible, essayer de trouver le joueur par email
      console.log('Profile API not available, trying to find player...')
    }

    // Récupérer les équipes pour trouver celle du joueur
    if (profile.value.player) {
      const teamsResponse = await teamsAPI.getAll()
      const teamsData = teamsResponse.data.data || teamsResponse.data

      const playerTeam = teamsData.find(team =>
        team.player1?.id === profile.value.player.id ||
        team.player2?.id === profile.value.player.id
      )

      if (playerTeam) {
        profile.value.team = playerTeam
      }
    }
  } catch (error) {
    console.error('Erreur lors du chargement du profil:', error)
  } finally {
    loading.value = false
  }
}

// Changer le mot de passe
const changePassword = async () => {
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    toast.error('Erreur', 'Les mots de passe ne correspondent pas')
    return
  }

  if (passwordForm.value.newPassword.length < 8) {
    toast.error('Erreur', 'Le mot de passe doit contenir au moins 8 caractères')
    return
  }

  try {
    loading.value = true
    await authAPI.changePassword(
      passwordForm.value.currentPassword,
      passwordForm.value.newPassword,
      passwordForm.value.confirmPassword
    )
    toast.success('Succès', 'Mot de passe modifié avec succès')
    showPasswordDialog.value = false
    passwordForm.value = { currentPassword: '', newPassword: '', confirmPassword: '' }
  } catch (error) {
    toast.error('Erreur', error.response?.data?.error?.message || 'Impossible de modifier le mot de passe')
  } finally {
    loading.value = false
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

const getInitials = (email) => {
  if (!email) return '?'
  return email.substring(0, 2).toUpperCase()
}

const teammate = computed(() => {
  if (!profile.value.team || !profile.value.player) return null
  const team = profile.value.team
  if (team.player1?.id === profile.value.player.id) {
    return team.player2
  }
  return team.player1
})

onMounted(loadProfile)
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-3xl font-bold tracking-tight">Mon Profil</h1>
      <p class="text-muted-foreground mt-1">Gérez vos informations personnelles</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Carte profil principal -->
      <Card class="lg:col-span-1 p-6">
        <div class="flex flex-col items-center text-center space-y-4">
          <!-- Avatar -->
          <div class="relative">
            <div class="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center text-3xl font-bold text-primary">
              {{ getInitials(profile.email) }}
            </div>
            <Badge
              v-if="profile.role === 'ADMINISTRATEUR'"
              class="absolute -bottom-1 -right-1"
              variant="default"
            >
              <Shield class="h-3 w-3 mr-1" />
              Admin
            </Badge>
          </div>

          <!-- Info compte -->
          <div class="space-y-1">
            <h2 class="text-xl font-bold">
              {{ profile.player ? `${profile.player.firstName} ${profile.player.lastName}` : profile.email }}
            </h2>
            <p class="text-sm text-muted-foreground">{{ profile.email }}</p>
          </div>

          <Separator />

          <!-- Stats rapides -->
          <div class="grid grid-cols-2 gap-4 w-full">
            <div class="text-center p-3 rounded-lg bg-muted/50">
              <Trophy class="h-5 w-5 mx-auto mb-1 text-primary" />
              <p class="text-lg font-bold">{{ profile.team ? '1' : '0' }}</p>
              <p class="text-xs text-muted-foreground">Équipe</p>
            </div>
            <div class="text-center p-3 rounded-lg bg-muted/50">
              <Award class="h-5 w-5 mx-auto mb-1 text-primary" />
              <p class="text-lg font-bold">{{ profile.team?.pool ? '1' : '0' }}</p>
              <p class="text-xs text-muted-foreground">Poule</p>
            </div>
          </div>

          <!-- Bouton changer mot de passe -->
          <Dialog v-model:open="showPasswordDialog">
            <DialogTrigger class="w-full">
              <Button variant="outline" class="w-full gap-2">
                <Lock class="h-4 w-4" />
                Changer le mot de passe
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Changer le mot de passe</DialogTitle>
                <DialogDescription>
                  Entrez votre mot de passe actuel et le nouveau mot de passe
                </DialogDescription>
              </DialogHeader>
              <div class="space-y-4 py-4">
                <div class="space-y-2">
                  <Label>Mot de passe actuel</Label>
                  <Input
                    type="password"
                    v-model="passwordForm.currentPassword"
                    placeholder="Votre mot de passe actuel"
                  />
                </div>
                <div class="space-y-2">
                  <Label>Nouveau mot de passe</Label>
                  <Input
                    type="password"
                    v-model="passwordForm.newPassword"
                    placeholder="Minimum 8 caractères"
                  />
                </div>
                <div class="space-y-2">
                  <Label>Confirmer le nouveau mot de passe</Label>
                  <Input
                    type="password"
                    v-model="passwordForm.confirmPassword"
                    placeholder="Répétez le nouveau mot de passe"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" @click="showPasswordDialog = false">
                  Annuler
                </Button>
                <Button @click="changePassword" :disabled="loading">
                  Enregistrer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </Card>

      <!-- Détails du compte -->
      <Card class="lg:col-span-2 p-6">
        <div class="space-y-6">
          <div class="flex items-center gap-2">
            <User class="h-5 w-5 text-primary" />
            <h3 class="text-lg font-semibold">Informations du compte</h3>
          </div>

          <Separator />

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Email -->
            <div class="space-y-2">
              <Label class="text-muted-foreground">Email</Label>
              <div class="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                <Mail class="h-4 w-4 text-muted-foreground" />
                <span>{{ profile.email }}</span>
              </div>
            </div>

            <!-- Rôle -->
            <div class="space-y-2">
              <Label class="text-muted-foreground">Rôle</Label>
              <div class="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                <Shield class="h-4 w-4 text-muted-foreground" />
                <Badge :variant="profile.role === 'ADMINISTRATEUR' ? 'default' : 'secondary'">
                  {{ profile.role === 'ADMINISTRATEUR' ? 'Administrateur' : 'Joueur' }}
                </Badge>
              </div>
            </div>

            <!-- Entreprise -->
            <div class="space-y-2" v-if="profile.player?.company || profile.team?.company">
              <Label class="text-muted-foreground">Entreprise</Label>
              <div class="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                <Building2 class="h-4 w-4 text-muted-foreground" />
                <span>{{ profile.player?.company || profile.team?.company }}</span>
              </div>
            </div>

            <!-- Date d'inscription -->
            <div class="space-y-2">
              <Label class="text-muted-foreground">Membre depuis</Label>
              <div class="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                <Calendar class="h-4 w-4 text-muted-foreground" />
                <span>{{ formatDate(profile.created_at || authStore.user?.created_at) }}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <!-- Équipe -->
      <Card class="lg:col-span-3 p-6" v-if="profile.team">
        <div class="space-y-6">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <Users class="h-5 w-5 text-primary" />
              <h3 class="text-lg font-semibold">Mon Équipe</h3>
            </div>
            <Badge variant="outline" v-if="profile.team.pool">
              {{ profile.team.pool.name }}
            </Badge>
          </div>

          <Separator />

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Ma fiche -->
            <div class="p-4 rounded-lg border-2 border-primary bg-primary/5">
              <div class="flex items-center gap-4">
                <div class="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <User class="h-8 w-8 text-primary" />
                </div>
                <div>
                  <Badge variant="default" class="mb-2">Moi</Badge>
                  <h4 class="font-bold text-lg">
                    {{ profile.player?.firstName }} {{ profile.player?.lastName }}
                  </h4>
                  <p class="text-sm text-muted-foreground">
                    Licence: {{ profile.player?.licenseNumber || 'Non renseigné' }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Coéquipier -->
            <div class="p-4 rounded-lg border bg-muted/30" v-if="teammate">
              <div class="flex items-center gap-4">
                <div class="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                  <User class="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <Badge variant="secondary" class="mb-2">Coéquipier</Badge>
                  <h4 class="font-bold text-lg">
                    {{ teammate.firstName }} {{ teammate.lastName }}
                  </h4>
                  <p class="text-sm text-muted-foreground">
                    Licence: {{ teammate.licenseNumber || 'Non renseigné' }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Info entreprise -->
          <div class="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
            <Building2 class="h-8 w-8 text-primary" />
            <div>
              <p class="font-semibold">{{ profile.team.company }}</p>
              <p class="text-sm text-muted-foreground">Entreprise représentée</p>
            </div>
          </div>
        </div>
      </Card>

      <!-- Message si pas d'équipe -->
      <Card class="lg:col-span-3 p-6" v-else>
        <div class="text-center py-8">
          <Users class="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 class="text-lg font-semibold mb-2">Pas encore d'équipe</h3>
          <p class="text-muted-foreground">
            Vous n'êtes pas encore associé à une équipe. Contactez l'administrateur pour rejoindre une équipe.
          </p>
        </div>
      </Card>
    </div>
  </div>
</template>
