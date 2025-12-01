<script setup>
import { ref, onMounted } from 'vue'
import { Plus, Edit, Trash, Search } from 'lucide-vue-next'
import Card from '@/components/ui/card.vue'
import Button from '@/components/ui/button.vue'
import Input from '@/components/ui/input.vue'
import Label from '@/components/ui/label.vue'
import Dialog from '@/components/ui/dialog.vue'
import DialogTrigger from '@/components/ui/dialog/DialogTrigger.vue'
import DialogContent from '@/components/ui/dialog/DialogContent.vue'
import DialogHeader from '@/components/ui/dialog/DialogHeader.vue'
import DialogTitle from '@/components/ui/dialog/DialogTitle.vue'
import DialogDescription from '@/components/ui/dialog/DialogDescription.vue'
import DialogFooter from '@/components/ui/dialog/DialogFooter.vue'
import Badge from '@/components/ui/badge.vue'
import { playersAPI } from '@/services/api'
import { useToast } from '@/composables/useToast'

const { toast } = useToast()

const players = ref([])
const loading = ref(false)
const showDialog = ref(false)
const editingPlayer = ref(null)
const searchQuery = ref('')

const formData = ref({
  firstName: '',
  lastName: '',
  company: '',
  licenseNumber: '',
  email: '',
  phone: ''
})

// Charger les joueurs
const loadPlayers = async () => {
  try {
    loading.value = true
    const params = searchQuery.value ? { search: searchQuery.value } : {}
    const response = await playersAPI.getAll(params)
    players.value = response.data.data || response.data
  } catch (error) {
    console.error('Erreur lors du chargement des joueurs:', error)
    toast.error('Erreur', 'Impossible de charger les joueurs')
  } finally {
    loading.value = false
  }
}

// Ouvrir le dialog pour créer/éditer
const openDialog = (player = null) => {
  if (player) {
    editingPlayer.value = player
    formData.value = {
      firstName: player.firstName,
      lastName: player.lastName,
      company: player.company,
      licenseNumber: player.licenseNumber || '',
      email: player.email || '',
      birthDate: player.birthDate || ''
    }
  } else {
    editingPlayer.value = null
    formData.value = {
      firstName: '',
      lastName: '',
      company: '',
      licenseNumber: '',
      email: '',
      birthDate: ''
    }
  }
  showDialog.value = true
}

// Sauvegarder un joueur
const savePlayer = async () => {
  if (!formData.value.firstName || !formData.value.lastName || !formData.value.company || !formData.value.licenseNumber) {
    toast.error('Erreur', 'Veuillez remplir tous les champs obligatoires')
    return
  }

  // Valider le format du numéro de licence
  const licenseRegex = /^L\d{6}$/
  if (!licenseRegex.test(formData.value.licenseNumber)) {
    toast.error('Erreur', 'Le numéro de licence doit être au format LXXXXXX (ex: L123456)')
    return
  }

  try {
    loading.value = true

    // Préparer les données sans le champ phone
    const playerData = {
      firstName: formData.value.firstName,
      lastName: formData.value.lastName,
      company: formData.value.company,
      licenseNumber: formData.value.licenseNumber,
      email: formData.value.email || undefined,
      birthDate: formData.value.birthDate || undefined
    }

    if (editingPlayer.value) {
      await playersAPI.update(editingPlayer.value.id, playerData)
      toast.success('Succès', 'Joueur modifié avec succès')
    } else {
      await playersAPI.create(playerData)
      toast.success('Succès', 'Joueur créé avec succès')
    }

    showDialog.value = false
    await loadPlayers()
  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error)
    const errorMessage = error.response?.data?.errors?.[0]?.message || error.response?.data?.message || 'Impossible de sauvegarder le joueur'
    toast.error('Erreur', errorMessage)
  } finally {
    loading.value = false
  }
}

// Supprimer un joueur
const deletePlayer = async (player) => {
  if (!confirm(`Êtes-vous sûr de vouloir supprimer ${player.firstName} ${player.lastName} ?`)) {
    return
  }

  try {
    loading.value = true
    await playersAPI.delete(player.id)
    toast.success('Succès', 'Joueur supprimé avec succès')
    await loadPlayers()
  } catch (error) {
    console.error('Erreur lors de la suppression:', error)
    toast.error('Erreur', error.response?.data?.message || 'Impossible de supprimer le joueur')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadPlayers()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Gestion des Joueurs</h1>
        <p class="text-muted-foreground mt-1">Créez et gérez tous les joueurs</p>
      </div>

      <Dialog v-model:open="showDialog">
        <DialogTrigger>
          <Button class="gap-2" @click="openDialog()">
            <Plus class="h-4 w-4" />
            Nouveau joueur
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{{ editingPlayer ? 'Modifier' : 'Créer' }} un joueur</DialogTitle>
            <DialogDescription>
              Remplissez les informations du joueur
            </DialogDescription>
          </DialogHeader>

          <div class="space-y-4 py-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label for="firstName">Prénom *</Label>
                <Input id="firstName" v-model="formData.firstName" placeholder="John" required />
              </div>
              <div class="space-y-2">
                <Label for="lastName">Nom *</Label>
                <Input id="lastName" v-model="formData.lastName" placeholder="Doe" required />
              </div>
            </div>

            <div class="space-y-2">
              <Label for="company">Entreprise *</Label>
              <Input id="company" v-model="formData.company" placeholder="Tech Corp" required />
            </div>

            <div class="space-y-2">
              <Label for="licenseNumber">Numéro de licence *</Label>
              <Input id="licenseNumber" v-model="formData.licenseNumber" placeholder="L123456" required />
              <p class="text-xs text-muted-foreground">Format: LXXXXXX (ex: L123456)</p>
            </div>

            <div class="space-y-2">
              <Label for="email">Email</Label>
              <Input id="email" v-model="formData.email" type="email" placeholder="john.doe@example.com" />
            </div>

            <div class="space-y-2">
              <Label for="birthDate">Date de naissance</Label>
              <Input id="birthDate" v-model="formData.birthDate" type="date" />
              <p class="text-xs text-muted-foreground">Optionnel</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" @click="showDialog = false">Annuler</Button>
            <Button @click="savePlayer" :disabled="loading">
              {{ editingPlayer ? 'Modifier' : 'Créer' }}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>

    <!-- Search -->
    <Card class="p-4">
      <div class="flex items-center gap-2">
        <Search class="h-5 w-5 text-muted-foreground" />
        <Input
          v-model="searchQuery"
          placeholder="Rechercher un joueur..."
          class="flex-1"
          @input="loadPlayers"
        />
      </div>
    </Card>

    <!-- Players List -->
    <Card class="p-6">
      <div class="space-y-4">
        <h3 class="text-lg font-semibold">Liste des joueurs ({{ players.length }})</h3>

        <div v-if="loading" class="text-center py-12">
          <p class="text-muted-foreground">Chargement...</p>
        </div>

        <div v-else-if="players.length === 0" class="text-center py-12">
          <p class="text-muted-foreground">Aucun joueur trouvé</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b">
                <th class="text-left py-3 px-4 font-semibold">Nom</th>
                <th class="text-left py-3 px-4 font-semibold">Entreprise</th>
                <th class="text-left py-3 px-4 font-semibold">Licence</th>
                <th class="text-left py-3 px-4 font-semibold">Contact</th>
                <th class="text-center py-3 px-4 font-semibold">Compte</th>
                <th class="text-right py-3 px-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="player in players"
                :key="player.id"
                class="border-b hover:bg-muted/50 transition-colors"
              >
                <td class="py-4 px-4">
                  <div class="font-medium">{{ player.firstName }} {{ player.lastName }}</div>
                </td>
                <td class="py-4 px-4">
                  <span class="text-sm">{{ player.company }}</span>
                </td>
                <td class="py-4 px-4">
                  <span class="text-sm text-muted-foreground">{{ player.licenseNumber || '-' }}</span>
                </td>
                <td class="py-4 px-4">
                  <div class="text-sm">
                    <div v-if="player.email">{{ player.email }}</div>
                    <div v-if="player.phone" class="text-muted-foreground">{{ player.phone }}</div>
                  </div>
                </td>
                <td class="py-4 px-4 text-center">
                  <Badge v-if="player.has_account" variant="default">Oui</Badge>
                  <Badge v-else variant="outline">Non</Badge>
                </td>
                <td class="py-4 px-4">
                  <div class="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="icon" @click="openDialog(player)">
                      <Edit class="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" @click="deletePlayer(player)" class="text-destructive hover:text-destructive">
                      <Trash class="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  </div>
</template>
