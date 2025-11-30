<script setup>
import { ref, onMounted, computed } from 'vue'
import { Plus, Edit, Trash, Users as UsersIcon } from 'lucide-vue-next'
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
import { teamsAPI, playersAPI, poolsAPI } from '@/services/api'
import { useToast } from '@/composables/useToast'

const { toast } = useToast()

const teams = ref([])
const players = ref([])
const pools = ref([])
const loading = ref(false)
const showDialog = ref(false)
const editingTeam = ref(null)

const formData = ref({
  company: '',
  player1Id: null,
  player2Id: null,
  poolId: null
})

// Options pour les selects
const playerOptions = computed(() =>
  players.value.map(p => ({
    value: p.id,
    label: `${p.firstName} ${p.lastName} (${p.company})`
  }))
)

const poolOptions = computed(() => [
  { value: null, label: 'Aucune poule' },
  ...pools.value.map(p => ({
    value: p.id,
    label: p.name
  }))
])

// Charger les données
const loadData = async () => {
  try {
    loading.value = true
    const [teamsResponse, playersResponse, poolsResponse] = await Promise.all([
      teamsAPI.getAll(),
      playersAPI.getAll(),
      poolsAPI.getAll()
    ])

    teams.value = teamsResponse.data.data || teamsResponse.data
    players.value = playersResponse.data.data || playersResponse.data
    pools.value = poolsResponse.data.data || poolsResponse.data
  } catch (error) {
    console.error('Erreur lors du chargement:', error)
    toast.error('Erreur', 'Impossible de charger les données')
  } finally {
    loading.value = false
  }
}

// Ouvrir le dialog
const openDialog = (team = null) => {
  if (team) {
    editingTeam.value = team
    formData.value = {
      company: team.company,
      player1Id: team.player1?.id || null,
      player2Id: team.player2?.id || null,
      poolId: team.pool?.id || null
    }
  } else {
    editingTeam.value = null
    formData.value = {
      company: '',
      player1Id: null,
      player2Id: null,
      poolId: null
    }
  }
  showDialog.value = true
}

// Sauvegarder une équipe
const saveTeam = async () => {
  if (!formData.value.company || !formData.value.player1Id || !formData.value.player2Id) {
    toast.error('Erreur', 'Veuillez remplir tous les champs obligatoires')
    return
  }

  if (formData.value.player1Id === formData.value.player2Id) {
    toast.error('Erreur', 'Les deux joueurs doivent être différents')
    return
  }

  try {
    loading.value = true

    const teamData = {
      company: formData.value.company,
      player1Id: Number(formData.value.player1Id),
      player2Id: Number(formData.value.player2Id),
      poolId: formData.value.poolId ? Number(formData.value.poolId) : null
    }

    if (editingTeam.value) {
      await teamsAPI.update(editingTeam.value.id, teamData)
      toast.success('Succès', 'Équipe modifiée avec succès')
    } else {
      await teamsAPI.create(teamData)
      toast.success('Succès', 'Équipe créée avec succès')
    }

    showDialog.value = false
    await loadData()
  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error)
    const errorMessage = error.response?.data?.errors?.[0]?.message || error.response?.data?.message || 'Impossible de sauvegarder l\'équipe'
    toast.error('Erreur', errorMessage)
  } finally {
    loading.value = false
  }
}

// Supprimer une équipe
const deleteTeam = async (team) => {
  if (!confirm(`Êtes-vous sûr de vouloir supprimer l'équipe ${team.company} ?`)) {
    return
  }

  try {
    loading.value = true
    await teamsAPI.delete(team.id)
    toast.success('Succès', 'Équipe supprimée avec succès')
    await loadData()
  } catch (error) {
    console.error('Erreur lors de la suppression:', error)
    toast.error('Erreur', error.response?.data?.message || 'Impossible de supprimer l\'équipe')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Gestion des Équipes</h1>
        <p class="text-muted-foreground mt-1">Créez et gérez toutes les équipes</p>
      </div>

      <Dialog v-model:open="showDialog">
        <DialogTrigger>
          <Button class="gap-2" @click="openDialog()">
            <Plus class="h-4 w-4" />
            Nouvelle équipe
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{{ editingTeam ? 'Modifier' : 'Créer' }} une équipe</DialogTitle>
            <DialogDescription>
              Sélectionnez deux joueurs pour former une équipe
            </DialogDescription>
          </DialogHeader>

          <div class="space-y-4 py-4">
            <div class="space-y-2">
              <Label for="company">Entreprise *</Label>
              <Input id="company" v-model="formData.company" placeholder="Tech Corp" required />
            </div>

            <div class="space-y-2">
              <Label for="player1">Joueur 1 *</Label>
              <Select
                id="player1"
                v-model="formData.player1Id"
                :options="playerOptions"
                placeholder="Sélectionner le joueur 1"
              />
            </div>

            <div class="space-y-2">
              <Label for="player2">Joueur 2 *</Label>
              <Select
                id="player2"
                v-model="formData.player2Id"
                :options="playerOptions"
                placeholder="Sélectionner le joueur 2"
              />
            </div>

            <div class="space-y-2">
              <Label for="pool">Poule (optionnel)</Label>
              <Select
                id="pool"
                v-model="formData.poolId"
                :options="poolOptions"
                placeholder="Assigner à une poule"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" @click="showDialog = false">Annuler</Button>
            <Button @click="saveTeam" :disabled="loading">
              {{ editingTeam ? 'Modifier' : 'Créer' }}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>

    <!-- Teams List -->
    <Card class="p-6">
      <div class="space-y-4">
        <h3 class="text-lg font-semibold">Liste des équipes ({{ teams.length }})</h3>

        <div v-if="loading" class="text-center py-12">
          <p class="text-muted-foreground">Chargement...</p>
        </div>

        <div v-else-if="teams.length === 0" class="text-center py-12">
          <UsersIcon class="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p class="text-muted-foreground text-lg mb-2">Aucune équipe trouvée</p>
          <p class="text-sm text-muted-foreground">Créez votre première équipe pour commencer</p>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card
            v-for="team in teams"
            :key="team.id"
            class="p-4 hover:shadow-lg transition-all"
          >
            <div class="space-y-3">
              <!-- Header -->
              <div class="flex items-start justify-between">
                <div>
                  <h4 class="font-bold text-lg">{{ team.company }}</h4>
                  <Badge v-if="team.pool" variant="outline" class="mt-1">
                    {{ team.pool.name }}
                  </Badge>
                </div>
                <div class="flex gap-1">
                  <Button variant="ghost" size="icon" @click="openDialog(team)">
                    <Edit class="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    @click="deleteTeam(team)"
                    class="text-destructive hover:text-destructive"
                  >
                    <Trash class="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <!-- Players -->
              <div class="space-y-2">
                <div class="flex items-center gap-2 text-sm">
                  <UsersIcon class="h-4 w-4 text-primary" />
                  <span class="font-medium">
                    {{ team.player1?.firstName }} {{ team.player1?.lastName }}
                  </span>
                </div>
                <div class="flex items-center gap-2 text-sm">
                  <UsersIcon class="h-4 w-4 text-primary" />
                  <span class="font-medium">
                    {{ team.player2?.firstName }} {{ team.player2?.lastName }}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Card>
  </div>
</template>
