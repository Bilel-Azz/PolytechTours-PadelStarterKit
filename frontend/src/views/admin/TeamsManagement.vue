<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { Plus, Edit, Trash, Users as UsersIcon, Search, Building2 } from 'lucide-vue-next'
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
const companySearch = ref('')
const showCompanyDropdown = ref(false)

const formData = ref({
  company: '',
  player1Id: null,
  player2Id: null,
  poolId: null
})

// Liste des entreprises uniques extraites des joueurs
const uniqueCompanies = computed(() => {
  const companies = [...new Set(players.value.map(p => p.company).filter(Boolean))]
  return companies.sort()
})

// Entreprises filtrées par la recherche
const filteredCompanies = computed(() => {
  if (!companySearch.value) return uniqueCompanies.value
  const search = companySearch.value.toLowerCase()
  return uniqueCompanies.value.filter(c => c.toLowerCase().includes(search))
})

// Joueurs filtrés par l'entreprise sélectionnée (et non déjà dans une équipe)
const playersInTeams = computed(() => {
  const playerIds = new Set()
  teams.value.forEach(team => {
    if (team.player1?.id) playerIds.add(team.player1.id)
    if (team.player2?.id) playerIds.add(team.player2.id)
  })
  // En mode édition, exclure les joueurs de l'équipe actuelle
  if (editingTeam.value) {
    if (editingTeam.value.player1?.id) playerIds.delete(editingTeam.value.player1.id)
    if (editingTeam.value.player2?.id) playerIds.delete(editingTeam.value.player2.id)
  }
  return playerIds
})

const availablePlayersForCompany = computed(() => {
  if (!formData.value.company) return []
  return players.value.filter(p =>
    p.company === formData.value.company &&
    !playersInTeams.value.has(p.id)
  )
})

// Options pour les selects de joueurs (filtrés par entreprise)
const playerOptions = computed(() =>
  availablePlayersForCompany.value.map(p => ({
    value: p.id,
    label: `${p.firstName} ${p.lastName}`
  }))
)

// Joueurs disponibles pour joueur 2 (exclure joueur 1 sélectionné)
const player2Options = computed(() =>
  playerOptions.value.filter(p => p.value !== formData.value.player1Id)
)

// Réinitialiser les joueurs quand l'entreprise change
watch(() => formData.value.company, () => {
  formData.value.player1Id = null
  formData.value.player2Id = null
})

// Sélectionner une entreprise
const selectCompany = (company) => {
  formData.value.company = company
  companySearch.value = company
  showCompanyDropdown.value = false
}

// Gérer le focus sur le champ entreprise
const onCompanyFocus = () => {
  showCompanyDropdown.value = true
  companySearch.value = formData.value.company
}

const onCompanyBlur = () => {
  // Délai pour permettre le clic sur une option
  setTimeout(() => {
    showCompanyDropdown.value = false
    // Si la recherche ne correspond pas à une entreprise existante, la garder quand même
    if (companySearch.value && !uniqueCompanies.value.includes(companySearch.value)) {
      formData.value.company = companySearch.value
    }
  }, 200)
}

const onCompanyInput = (e) => {
  companySearch.value = e.target.value
  formData.value.company = e.target.value
  showCompanyDropdown.value = true
}

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
    companySearch.value = team.company
  } else {
    editingTeam.value = null
    formData.value = {
      company: '',
      player1Id: null,
      player2Id: null,
      poolId: null
    }
    companySearch.value = ''
  }
  showCompanyDropdown.value = false
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
const deleteTeam = async (team, force = false) => {
  const message = force
    ? `Êtes-vous sûr de vouloir FORCER la suppression de l'équipe ${team.company} ? Les matchs seront conservés mais l'équipe sera supprimée.`
    : `Êtes-vous sûr de vouloir supprimer l'équipe ${team.company} ?`

  if (!confirm(message)) {
    return
  }

  try {
    loading.value = true
    await teamsAPI.delete(team.id, force)
    toast.success('Succès', 'Équipe supprimée avec succès')
    await loadData()
  } catch (error) {
    console.error('Erreur lors de la suppression:', error)
    const errorData = error.response?.data?.error

    // Si l'équipe a des matchs, proposer la suppression forcée
    if (errorData?.code === 'TEAM_HAS_MATCHES') {
      const forceDelete = confirm(
        `Cette équipe a joué ${errorData.matchCount || 'des'} match(s).\n\n` +
        `Voulez-vous quand même la supprimer ?\n` +
        `(Les matchs seront conservés dans l'historique)`
      )
      if (forceDelete) {
        await deleteTeam(team, true)
      }
    } else {
      toast.error('Erreur', errorData?.message || 'Impossible de supprimer l\'équipe')
    }
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
            <!-- Sélecteur d'entreprise avec recherche -->
            <div class="space-y-2">
              <Label for="company">Entreprise *</Label>
              <div class="relative">
                <div class="relative">
                  <Building2 class="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    id="company"
                    type="text"
                    :value="companySearch"
                    @input="onCompanyInput"
                    @focus="onCompanyFocus"
                    @blur="onCompanyBlur"
                    placeholder="Rechercher une entreprise..."
                    class="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </div>
                <!-- Dropdown des entreprises -->
                <div
                  v-if="showCompanyDropdown && filteredCompanies.length > 0"
                  class="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg max-h-48 overflow-auto"
                >
                  <div
                    v-for="company in filteredCompanies"
                    :key="company"
                    @mousedown.prevent="selectCompany(company)"
                    class="px-3 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground text-sm"
                  >
                    {{ company }}
                  </div>
                </div>
                <!-- Message si aucune entreprise trouvée -->
                <div
                  v-if="showCompanyDropdown && companySearch && filteredCompanies.length === 0"
                  class="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg p-3"
                >
                  <p class="text-sm text-muted-foreground">Aucune entreprise trouvée</p>
                  <p class="text-xs text-muted-foreground mt-1">Une nouvelle entreprise sera créée</p>
                </div>
              </div>
              <p v-if="formData.company && availablePlayersForCompany.length === 0" class="text-sm text-amber-600">
                Aucun joueur disponible pour cette entreprise
              </p>
              <p v-else-if="formData.company" class="text-sm text-muted-foreground">
                {{ availablePlayersForCompany.length }} joueur(s) disponible(s)
              </p>
            </div>

            <!-- Joueur 1 - filtré par entreprise -->
            <div class="space-y-2">
              <Label for="player1">Joueur 1 *</Label>
              <Select
                id="player1"
                v-model="formData.player1Id"
                :options="playerOptions"
                :placeholder="formData.company ? 'Sélectionner le joueur 1' : 'Sélectionnez d\'abord une entreprise'"
                :disabled="!formData.company || playerOptions.length === 0"
              />
            </div>

            <!-- Joueur 2 - filtré par entreprise et excluant joueur 1 -->
            <div class="space-y-2">
              <Label for="player2">Joueur 2 *</Label>
              <Select
                id="player2"
                v-model="formData.player2Id"
                :options="player2Options"
                :placeholder="formData.player1Id ? 'Sélectionner le joueur 2' : 'Sélectionnez d\'abord le joueur 1'"
                :disabled="!formData.player1Id || player2Options.length === 0"
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
