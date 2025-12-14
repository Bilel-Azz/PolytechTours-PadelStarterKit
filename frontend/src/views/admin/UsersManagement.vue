<script setup>
import { ref, onMounted, computed } from 'vue'
import { Plus, Edit, Trash, User, Shield, ShieldCheck, Lock, Unlock, Key } from 'lucide-vue-next'
import Card from '@/components/ui/card.vue'
import Button from '@/components/ui/button.vue'
import Label from '@/components/ui/label.vue'
import Input from '@/components/ui/input.vue'
import Select from '@/components/ui/select.vue'
import Dialog from '@/components/ui/dialog.vue'
import DialogTrigger from '@/components/ui/dialog/DialogTrigger.vue'
import DialogContent from '@/components/ui/dialog/DialogContent.vue'
import DialogHeader from '@/components/ui/dialog/DialogHeader.vue'
import DialogTitle from '@/components/ui/dialog/DialogTitle.vue'
import DialogDescription from '@/components/ui/dialog/DialogDescription.vue'
import DialogFooter from '@/components/ui/dialog/DialogFooter.vue'
import Badge from '@/components/ui/badge.vue'
import { adminAPI } from '@/services/api'
import { useToast } from '@/composables/useToast'

const { toast } = useToast()

const users = ref([])
const loading = ref(false)
const showDialog = ref(false)
const showPasswordDialog = ref(false)
const editingUser = ref(null)
const newPassword = ref('')

const formData = ref({
  email: '',
  password: '',
  role: 'JOUEUR',
  is_active: true
})

const roleOptions = [
  { value: 'JOUEUR', label: 'Joueur' },
  { value: 'ADMINISTRATEUR', label: 'Administrateur' }
]

const activeOptions = [
  { value: true, label: 'Actif' },
  { value: false, label: 'Inactif' }
]

const loadData = async () => {
  try {
    loading.value = true
    const response = await adminAPI.getUsers()
    users.value = response.data.data || response.data
  } catch (error) {
    console.error('Erreur:', error)
    toast.error('Erreur', 'Impossible de charger les utilisateurs')
  } finally {
    loading.value = false
  }
}

const openDialog = (user = null) => {
  if (user) {
    editingUser.value = user
    formData.value = {
      email: user.email,
      password: '',
      role: user.role,
      is_active: user.is_active
    }
  } else {
    editingUser.value = null
    formData.value = {
      email: '',
      password: '',
      role: 'JOUEUR',
      is_active: true
    }
  }
  showDialog.value = true
}

const saveUser = async () => {
  if (!formData.value.email) {
    toast.error('Erreur', 'L\'email est requis')
    return
  }

  if (!editingUser.value && !formData.value.password) {
    toast.error('Erreur', 'Le mot de passe est requis pour un nouvel utilisateur')
    return
  }

  try {
    loading.value = true

    if (editingUser.value) {
      await adminAPI.updateUser(editingUser.value.id, {
        email: formData.value.email,
        role: formData.value.role,
        is_active: formData.value.is_active
      })
      toast.success('Succès', 'Utilisateur modifié')
    } else {
      await adminAPI.createUser({
        email: formData.value.email,
        password: formData.value.password,
        role: formData.value.role,
        is_active: formData.value.is_active
      })
      toast.success('Succès', 'Utilisateur créé')
    }

    showDialog.value = false
    await loadData()
  } catch (error) {
    console.error('Erreur:', error)
    toast.error('Erreur', error.response?.data?.error?.message || 'Impossible de sauvegarder')
  } finally {
    loading.value = false
  }
}

const deleteUser = async (user) => {
  if (!confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${user.email} ?`)) return

  try {
    loading.value = true
    await adminAPI.deleteUser(user.id)
    toast.success('Succès', 'Utilisateur supprimé')
    await loadData()
  } catch (error) {
    toast.error('Erreur', 'Impossible de supprimer l\'utilisateur')
  } finally {
    loading.value = false
  }
}

const unlockUser = async (user) => {
  try {
    loading.value = true
    await adminAPI.unlockUser(user.id)
    toast.success('Succès', 'Compte déverrouillé')
    await loadData()
  } catch (error) {
    toast.error('Erreur', 'Impossible de déverrouiller le compte')
  } finally {
    loading.value = false
  }
}

const openPasswordDialog = (user) => {
  editingUser.value = user
  newPassword.value = ''
  showPasswordDialog.value = true
}

const resetPassword = async () => {
  try {
    loading.value = true
    const response = await adminAPI.resetPassword(editingUser.value.id)
    newPassword.value = response.data.data?.temporary_password || 'Mot de passe généré'
    toast.success('Succès', 'Mot de passe réinitialisé')
  } catch (error) {
    toast.error('Erreur', 'Impossible de réinitialiser le mot de passe')
  } finally {
    loading.value = false
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return '-'
  }
}

onMounted(loadData)
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Gestion des Utilisateurs</h1>
        <p class="text-muted-foreground mt-1">Gérez les comptes utilisateurs de l'application</p>
      </div>

      <Dialog v-model:open="showDialog">
        <DialogTrigger>
          <Button class="gap-2" @click="openDialog()">
            <Plus class="h-4 w-4" />
            Nouvel utilisateur
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{{ editingUser ? 'Modifier' : 'Créer' }} un utilisateur</DialogTitle>
            <DialogDescription>Gérez les informations du compte</DialogDescription>
          </DialogHeader>

          <div class="space-y-4 py-4">
            <div class="space-y-2">
              <Label>Email *</Label>
              <Input type="email" v-model="formData.email" placeholder="email@example.com" />
            </div>

            <div v-if="!editingUser" class="space-y-2">
              <Label>Mot de passe *</Label>
              <Input type="password" v-model="formData.password" placeholder="Minimum 8 caractères" />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label>Rôle</Label>
                <Select v-model="formData.role" :options="roleOptions" />
              </div>
              <div class="space-y-2">
                <Label>Statut</Label>
                <Select v-model="formData.is_active" :options="activeOptions" />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" @click="showDialog = false">Annuler</Button>
            <Button @click="saveUser" :disabled="loading">
              {{ editingUser ? 'Modifier' : 'Créer' }}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <!-- Password Reset Dialog -->
      <Dialog v-model:open="showPasswordDialog">
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
            <DialogDescription>
              {{ editingUser?.email }}
            </DialogDescription>
          </DialogHeader>

          <div class="py-4">
            <div v-if="newPassword" class="p-4 bg-muted rounded-lg">
              <p class="text-sm font-medium mb-2">Nouveau mot de passe temporaire :</p>
              <code class="text-lg font-mono bg-background p-2 rounded block">{{ newPassword }}</code>
              <p class="text-xs text-muted-foreground mt-2">
                L'utilisateur devra changer ce mot de passe à sa prochaine connexion.
              </p>
            </div>
            <div v-else>
              <p class="text-sm text-muted-foreground">
                Un nouveau mot de passe temporaire sera généré. L'utilisateur devra le changer à sa prochaine connexion.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" @click="showPasswordDialog = false">Fermer</Button>
            <Button v-if="!newPassword" @click="resetPassword" :disabled="loading">
              Générer un nouveau mot de passe
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>

    <Card class="p-6">
      <h3 class="text-lg font-semibold mb-4">Liste des utilisateurs ({{ users.length }})</h3>

      <div v-if="loading" class="text-center py-12">
        <p class="text-muted-foreground">Chargement...</p>
      </div>

      <div v-else-if="users.length === 0" class="text-center py-12">
        <User class="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
        <p class="text-muted-foreground">Aucun utilisateur trouvé</p>
      </div>

      <div v-else class="space-y-3">
        <Card v-for="user in users" :key="user.id" class="p-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div class="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <ShieldCheck v-if="user.role === 'ADMINISTRATEUR'" class="h-5 w-5 text-primary" />
                <User v-else class="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <span class="font-medium">{{ user.email }}</span>
                  <Badge :variant="user.is_active ? 'success' : 'destructive'">
                    {{ user.is_active ? 'Actif' : 'Inactif' }}
                  </Badge>
                  <Badge variant="outline">{{ user.role }}</Badge>
                </div>
                <p class="text-sm text-muted-foreground">
                  Créé le {{ formatDate(user.created_at) }}
                </p>
              </div>
            </div>
            <div class="flex gap-1">
              <Button variant="ghost" size="icon" title="Réinitialiser le mot de passe" @click="openPasswordDialog(user)">
                <Key class="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" title="Déverrouiller le compte" @click="unlockUser(user)">
                <Unlock class="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" @click="openDialog(user)">
                <Edit class="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" class="text-destructive" @click="deleteUser(user)">
                <Trash class="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </Card>
  </div>
</template>
