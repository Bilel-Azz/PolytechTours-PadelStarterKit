<script setup>
import { ref, onMounted, computed } from 'vue'
import { Plus, Edit, Trash, Calendar, Trophy, Users } from 'lucide-vue-next'
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
import { matchesAPI, teamsAPI, eventsAPI } from '@/services/api'
import { useToast } from '@/composables/useToast'

const { toast } = useToast()

const matches = ref([])
const teams = ref([])
const events = ref([])
const loading = ref(false)
const showDialog = ref(false)
const editingMatch = ref(null)

const formData = ref({
  eventId: null,
  team1Id: null,
  team2Id: null,
  courtNumber: 1,
  status: 'A_VENIR',
  scoreTeam1: '',
  scoreTeam2: ''
})

const statusOptions = [
  { value: 'A_VENIR', label: 'À venir' },
  { value: 'EN_COURS', label: 'En cours' },
  { value: 'TERMINE', label: 'Terminé' },
  { value: 'ANNULE', label: 'Annulé' }
]

const teamOptions = computed(() =>
  teams.value.map(t => ({
    value: t.id,
    label: `${t.company} (${t.player1?.firstName || '?'} & ${t.player2?.firstName || '?'})`
  }))
)

const eventOptions = computed(() =>
  events.value.map(e => ({
    value: e.id,
    label: `${e.eventDate} - ${e.eventTime}`
  }))
)

const getStatusBadge = (status) => {
  const variants = {
    'A_VENIR': 'secondary',
    'EN_COURS': 'default',
    'TERMINE': 'success',
    'ANNULE': 'destructive'
  }
  return variants[status] || 'secondary'
}

const getStatusLabel = (status) => {
  const labels = {
    'A_VENIR': 'À venir',
    'EN_COURS': 'En cours',
    'TERMINE': 'Terminé',
    'ANNULE': 'Annulé'
  }
  return labels[status] || status
}

const loadData = async () => {
  try {
    loading.value = true
    const [matchesRes, teamsRes, eventsRes] = await Promise.all([
      matchesAPI.getAll(),
      teamsAPI.getAll(),
      eventsAPI.getAll()
    ])
    matches.value = matchesRes.data.data || matchesRes.data
    teams.value = teamsRes.data.data || teamsRes.data
    events.value = eventsRes.data.data || eventsRes.data
  } catch (error) {
    console.error('Erreur:', error)
    toast.error('Erreur', 'Impossible de charger les données')
  } finally {
    loading.value = false
  }
}

const openDialog = (match = null) => {
  if (match) {
    editingMatch.value = match
    formData.value = {
      eventId: match.eventId,
      team1Id: match.team1Id,
      team2Id: match.team2Id,
      courtNumber: match.courtNumber,
      status: match.status,
      scoreTeam1: match.scoreTeam1 || '',
      scoreTeam2: match.scoreTeam2 || ''
    }
  } else {
    editingMatch.value = null
    formData.value = {
      eventId: null,
      team1Id: null,
      team2Id: null,
      courtNumber: 1,
      status: 'A_VENIR',
      scoreTeam1: '',
      scoreTeam2: ''
    }
  }
  showDialog.value = true
}

const saveMatch = async () => {
  if (!formData.value.eventId || !formData.value.team1Id || !formData.value.team2Id) {
    toast.error('Erreur', 'Veuillez remplir tous les champs obligatoires')
    return
  }

  try {
    loading.value = true
    const matchData = {
      eventId: Number(formData.value.eventId),
      team1Id: Number(formData.value.team1Id),
      team2Id: Number(formData.value.team2Id),
      courtNumber: Number(formData.value.courtNumber),
      status: formData.value.status,
      scoreTeam1: formData.value.scoreTeam1 || null,
      scoreTeam2: formData.value.scoreTeam2 || null
    }

    if (editingMatch.value) {
      await matchesAPI.update(editingMatch.value.id, matchData)
      toast.success('Succès', 'Match modifié avec succès')
    } else {
      await matchesAPI.create(matchData)
      toast.success('Succès', 'Match créé avec succès')
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

const deleteMatch = async (match) => {
  if (!confirm('Êtes-vous sûr de vouloir supprimer ce match ?')) return

  try {
    loading.value = true
    await matchesAPI.delete(match.id)
    toast.success('Succès', 'Match supprimé')
    await loadData()
  } catch (error) {
    toast.error('Erreur', 'Impossible de supprimer le match')
  } finally {
    loading.value = false
  }
}

const getTeamName = (team) => {
  if (!team) return 'Équipe supprimée'
  return team.company || 'Équipe supprimée'
}

onMounted(loadData)
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Gestion des Matchs</h1>
        <p class="text-muted-foreground mt-1">Gérez tous les matchs du tournoi</p>
      </div>

      <Dialog v-model:open="showDialog">
        <DialogTrigger>
          <Button class="gap-2" @click="openDialog()">
            <Plus class="h-4 w-4" />
            Nouveau match
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{{ editingMatch ? 'Modifier' : 'Créer' }} un match</DialogTitle>
            <DialogDescription>Configurez les détails du match</DialogDescription>
          </DialogHeader>

          <div class="space-y-4 py-4">
            <div class="space-y-2">
              <Label>Événement *</Label>
              <Select v-model="formData.eventId" :options="eventOptions" placeholder="Sélectionner un événement" />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label>Équipe 1 *</Label>
                <Select v-model="formData.team1Id" :options="teamOptions" placeholder="Équipe 1" />
              </div>
              <div class="space-y-2">
                <Label>Équipe 2 *</Label>
                <Select v-model="formData.team2Id" :options="teamOptions" placeholder="Équipe 2" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label>Court</Label>
                <Input type="number" v-model="formData.courtNumber" min="1" max="10" />
              </div>
              <div class="space-y-2">
                <Label>Statut</Label>
                <Select v-model="formData.status" :options="statusOptions" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label>Score Équipe 1</Label>
                <Input v-model="formData.scoreTeam1" placeholder="6-4, 6-3" />
              </div>
              <div class="space-y-2">
                <Label>Score Équipe 2</Label>
                <Input v-model="formData.scoreTeam2" placeholder="4-6, 3-6" />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" @click="showDialog = false">Annuler</Button>
            <Button @click="saveMatch" :disabled="loading">
              {{ editingMatch ? 'Modifier' : 'Créer' }}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>

    <Card class="p-6">
      <h3 class="text-lg font-semibold mb-4">Liste des matchs ({{ matches.length }})</h3>

      <div v-if="loading" class="text-center py-12">
        <p class="text-muted-foreground">Chargement...</p>
      </div>

      <div v-else-if="matches.length === 0" class="text-center py-12">
        <Trophy class="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
        <p class="text-muted-foreground">Aucun match trouvé</p>
      </div>

      <div v-else class="space-y-3">
        <Card v-for="match in matches" :key="match.id" class="p-4">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-4 mb-2">
                <Badge :variant="getStatusBadge(match.status)">
                  {{ getStatusLabel(match.status) }}
                </Badge>
                <span class="text-sm text-muted-foreground">Court {{ match.courtNumber }}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="font-medium">{{ getTeamName(match.team1) }}</span>
                <span class="text-muted-foreground">vs</span>
                <span class="font-medium">{{ getTeamName(match.team2) }}</span>
              </div>
              <div v-if="match.scoreTeam1 || match.scoreTeam2" class="text-sm text-muted-foreground mt-1">
                Score: {{ match.scoreTeam1 || '-' }} / {{ match.scoreTeam2 || '-' }}
              </div>
            </div>
            <div class="flex gap-1">
              <Button variant="ghost" size="icon" @click="openDialog(match)">
                <Edit class="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" class="text-destructive" @click="deleteMatch(match)">
                <Trash class="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </Card>
  </div>
</template>
