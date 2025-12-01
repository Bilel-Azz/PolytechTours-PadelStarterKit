<script setup>
import { ref, computed, onMounted } from 'vue'
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, MapPin, Users, MoreVertical, Edit, Trash, Eye, CheckCircle2 } from 'lucide-vue-next'
import Button from '../components/ui/button.vue'
import Card from '../components/ui/card.vue'
import Badge from '../components/ui/badge.vue'
import Input from '../components/ui/input.vue'
import Label from '../components/ui/label.vue'
import Select from '../components/ui/select.vue'
import Separator from '../components/ui/separator.vue'
import Dialog from '../components/ui/dialog.vue'
import DialogTrigger from '../components/ui/dialog/DialogTrigger.vue'
import DialogContent from '../components/ui/dialog/DialogContent.vue'
import DialogHeader from '../components/ui/dialog/DialogHeader.vue'
import DialogTitle from '../components/ui/dialog/DialogTitle.vue'
import DialogDescription from '../components/ui/dialog/DialogDescription.vue'
import DialogFooter from '../components/ui/dialog/DialogFooter.vue'
import DropdownMenu from '../components/ui/dropdown-menu.vue'
import DropdownMenuTrigger from '../components/ui/dropdown-menu/DropdownMenuTrigger.vue'
import DropdownMenuContent from '../components/ui/dropdown-menu/DropdownMenuContent.vue'
import DropdownMenuItem from '../components/ui/dropdown-menu/DropdownMenuItem.vue'
import DropdownMenuSeparator from '../components/ui/dropdown-menu/DropdownMenuSeparator.vue'
import { useToast } from '@/composables/useToast'
import { eventsAPI, matchesAPI, teamsAPI } from '@/services/api'

const { toast } = useToast()

// État du calendrier
const currentDate = ref(new Date())
const selectedDate = ref(null)
const showEventDialog = ref(false)
const showEditDialog = ref(false)
const editingEvent = ref(null)
const loading = ref(false)

// Form state
const newEvent = ref({
  date: '',
  time: '',
  court: 1,
  team1Id: null,
  team2Id: null
})

// Data from API
const events = ref([])
const teams = ref([])

// Charger les équipes disponibles
const loadTeams = async () => {
  try {
    const response = await teamsAPI.getAll()
    const teamsData = response.data.data || response.data
    teams.value = teamsData.map(team => ({
      value: team.id,
      label: `${team.company} (${team.player1.firstName} ${team.player1.lastName} & ${team.player2.firstName} ${team.player2.lastName})`
    }))
  } catch (error) {
    console.error('Erreur lors du chargement des équipes:', error)
  }
}

// Charger les événements depuis l'API
const loadEvents = async () => {
  try {
    loading.value = true
    const eventsResponse = await eventsAPI.getAll()

    // Le backend retourne déjà les événements avec leurs matchs et équipes
    const eventsData = eventsResponse.data.data || eventsResponse.data

    // Transformer les données pour correspondre au format attendu par le template
    events.value = eventsData.map(event => ({
      id: event.id,
      date: event.eventDate, // Backend retourne eventDate
      time: event.eventTime, // Backend retourne eventTime
      matches: event.matches.map(match => ({
        id: match.id,
        court: match.courtNumber,
        team1: {
          id: match.team1.id,
          company: match.team1.company,
          players: [
            `${match.team1.player1.firstName} ${match.team1.player1.lastName}`,
            `${match.team1.player2.firstName} ${match.team1.player2.lastName}`
          ]
        },
        team2: {
          id: match.team2.id,
          company: match.team2.company,
          players: [
            `${match.team2.player1.firstName} ${match.team2.player1.lastName}`,
            `${match.team2.player2.firstName} ${match.team2.player2.lastName}`
          ]
        },
        status: match.status
      }))
    })).filter(event => event.matches.length > 0)
  } catch (error) {
    console.error('Erreur lors du chargement des événements:', error)
    toast.error('Erreur', 'Impossible de charger les événements')
  } finally {
    loading.value = false
  }
}

// Charger les données au montage
onMounted(() => {
  loadEvents()
  loadTeams()
})

// Fonctions de navigation du calendrier
const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

const currentMonth = computed(() => monthNames[currentDate.value.getMonth()])
const currentYear = computed(() => currentDate.value.getFullYear())

const previousMonth = () => {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1)
}

const nextMonth = () => {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1)
}

// Génération des jours du calendrier
const calendarDays = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  const startDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1

  const days = []

  const prevMonthLastDay = new Date(year, month, 0).getDate()
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    days.push({
      day: prevMonthLastDay - i,
      isCurrentMonth: false,
      date: new Date(year, month - 1, prevMonthLastDay - i)
    })
  }

  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push({
      day: i,
      isCurrentMonth: true,
      date: new Date(year, month, i)
    })
  }

  const remainingDays = 42 - days.length
  for (let i = 1; i <= remainingDays; i++) {
    days.push({
      day: i,
      isCurrentMonth: false,
      date: new Date(year, month + 1, i)
    })
  }

  return days
})

// Vérifier si une date a des événements
const hasEvents = (date) => {
  const dateStr = formatDate(date)
  return events.value.some(event => event.date === dateStr)
}

// Obtenir les événements d'une date
const getEventsForDate = (date) => {
  const dateStr = formatDate(date)
  return events.value.filter(event => event.date === dateStr)
}

// Formater une date en YYYY-MM-DD
const formatDate = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Formater une date en format lisible
const formatDateReadable = (dateStr) => {
  const date = new Date(dateStr + 'T00:00:00')
  const dayName = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'][date.getDay()]
  const day = date.getDate()
  const month = monthNames[date.getMonth()]
  const year = date.getFullYear()
  return `${dayName} ${day} ${month} ${year}`
}

// Vérifier si c'est aujourd'hui
const isToday = (date) => {
  const today = new Date()
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear()
}

// Sélectionner une date
const selectDate = (dayObj) => {
  if (dayObj.isCurrentMonth) {
    selectedDate.value = dayObj.date
  }
}

// Obtenir la classe du badge selon le statut
const getStatusBadgeVariant = (status) => {
  switch (status) {
    case 'A_VENIR':
      return 'default'
    case 'TERMINE':
      return 'secondary'
    case 'ANNULE':
      return 'destructive'
    default:
      return 'outline'
  }
}

const getStatusLabel = (status) => {
  switch (status) {
    case 'A_VENIR':
      return 'À venir'
    case 'TERMINE':
      return 'Terminé'
    case 'ANNULE':
      return 'Annulé'
    default:
      return status
  }
}

// Ajouter un événement
const addEvent = async () => {
  if (!newEvent.value.date || !newEvent.value.time || !newEvent.value.team1Id || !newEvent.value.team2Id) {
    toast.error('Erreur', 'Veuillez remplir tous les champs obligatoires')
    return
  }

  if (newEvent.value.team1Id === newEvent.value.team2Id) {
    toast.error('Erreur', 'Une équipe ne peut pas jouer contre elle-même')
    return
  }

  try {
    loading.value = true

    // Créer l'événement avec le match selon le schéma du backend
    const eventData = {
      eventDate: newEvent.value.date,
      eventTime: newEvent.value.time,
      matches: [
        {
          team1Id: newEvent.value.team1Id,
          team2Id: newEvent.value.team2Id,
          courtNumber: newEvent.value.court
        }
      ]
    }

    await eventsAPI.create(eventData)

    // Recharger les événements
    await loadEvents()

    showEventDialog.value = false

    // Reset form
    newEvent.value = {
      date: '',
      time: '',
      court: 1,
      team1Id: null,
      team2Id: null
    }

    toast.success('Événement créé', 'L\'événement a été ajouté au planning')
  } catch (error) {
    console.error('Erreur lors de la création de l\'événement:', error)
    const errorMessage = error.response?.data?.errors?.[0]?.message || error.response?.data?.message || 'Impossible de créer l\'événement'
    toast.error('Erreur', errorMessage)
  } finally {
    loading.value = false
  }
}

// Actions sur les matchs
const viewMatchDetails = (match) => {
  toast('Détails du match', `${match.team1.company} vs ${match.team2.company}`)
}

const editMatch = (match) => {
  editingEvent.value = match
  showEditDialog.value = true
  toast('Édition', 'Ouverture de l\'éditeur de match')
}

const deleteMatch = async (matchId, eventId) => {
  try {
    loading.value = true
    await matchesAPI.delete(matchId)

    // Vérifier si l'événement a encore des matchs
    const event = events.value.find(e => e.id === eventId)
    if (event && event.matches.length === 1) {
      // Si c'était le dernier match, supprimer l'événement aussi
      await eventsAPI.delete(eventId)
    }

    // Recharger les événements
    await loadEvents()

    toast.success('Match supprimé', 'Le match a été supprimé du planning')
  } catch (error) {
    console.error('Erreur lors de la suppression du match:', error)
    toast.error('Erreur', error.response?.data?.message || 'Impossible de supprimer le match')
  } finally {
    loading.value = false
  }
}

const markAsComplete = async (match) => {
  try {
    loading.value = true
    await matchesAPI.update(match.id, { status: 'TERMINE' })

    // Mettre à jour localement
    match.status = 'TERMINE'

    toast.success('Match terminé', `${match.team1.company} vs ${match.team2.company} marqué comme terminé`)
  } catch (error) {
    console.error('Erreur lors de la mise à jour du match:', error)
    toast.error('Erreur', error.response?.data?.message || 'Impossible de mettre à jour le match')
  } finally {
    loading.value = false
  }
}

const courtOptions = [
  { value: 1, label: 'Piste 1' },
  { value: 2, label: 'Piste 2' },
  { value: 3, label: 'Piste 3' },
  { value: 4, label: 'Piste 4' }
]
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Planning</h1>
        <p class="text-muted-foreground mt-1">Organisez et visualisez tous les événements de la saison</p>
      </div>

      <!-- Dialog pour ajouter un événement -->
      <Dialog v-model:open="showEventDialog">
        <DialogTrigger>
          <Button class="gap-2">
            <Plus class="h-4 w-4" />
            Nouvel événement
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer un nouvel événement</DialogTitle>
            <DialogDescription>
              Ajoutez un nouveau match au planning
            </DialogDescription>
          </DialogHeader>

          <div class="space-y-4 py-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label for="date">Date *</Label>
                <Input id="date" v-model="newEvent.date" type="date" required />
              </div>
              <div class="space-y-2">
                <Label for="time">Heure *</Label>
                <Input id="time" v-model="newEvent.time" type="time" required />
              </div>
            </div>

            <div class="space-y-2">
              <Label for="court">Piste</Label>
              <Select id="court" v-model="newEvent.court" :options="courtOptions" />
            </div>

            <Separator />

            <div class="space-y-2">
              <Label for="team1">Équipe 1 *</Label>
              <Select id="team1" v-model="newEvent.team1Id" :options="teams" placeholder="Sélectionner l'équipe 1" />
            </div>

            <div class="space-y-2">
              <Label for="team2">Équipe 2 *</Label>
              <Select id="team2" v-model="newEvent.team2Id" :options="teams" placeholder="Sélectionner l'équipe 2" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" @click="showEventDialog = false">Annuler</Button>
            <Button @click="addEvent">Créer l'événement</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>

    <!-- Calendrier -->
    <Card class="p-6">
      <!-- Navigation du mois -->
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-semibold">
          {{ currentMonth }} {{ currentYear }}
        </h2>
        <div class="flex gap-2">
          <Button variant="outline" size="icon" @click="previousMonth">
            <ChevronLeft class="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" @click="nextMonth">
            <ChevronRight class="h-4 w-4" />
          </Button>
        </div>
      </div>

      <!-- Grille du calendrier -->
      <div class="grid grid-cols-7 gap-2">
        <!-- Noms des jours -->
        <div
          v-for="day in dayNames"
          :key="day"
          class="text-center text-sm font-medium text-muted-foreground py-2"
        >
          {{ day }}
        </div>

        <!-- Jours du calendrier -->
        <button
          v-for="(dayObj, index) in calendarDays"
          :key="index"
          @click="selectDate(dayObj)"
          :class="[
            'relative aspect-square rounded-lg p-2 text-sm transition-all hover:shadow-md',
            dayObj.isCurrentMonth
              ? 'text-foreground hover:bg-muted'
              : 'text-muted-foreground',
            isToday(dayObj.date)
              ? 'bg-primary text-primary-foreground font-bold ring-2 ring-primary ring-offset-2'
              : '',
            selectedDate && formatDate(selectedDate) === formatDate(dayObj.date)
              ? 'bg-accent ring-2 ring-primary'
              : ''
          ]"
        >
          <span>{{ dayObj.day }}</span>
          <!-- Indicateur d'événement -->
          <span
            v-if="hasEvents(dayObj.date) && dayObj.isCurrentMonth"
            class="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-primary rounded-full"
          />
        </button>
      </div>
    </Card>

    <!-- Détails de la date sélectionnée -->
    <Card v-if="selectedDate" class="p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold">
          Événements du {{ formatDateReadable(formatDate(selectedDate)) }}
        </h3>
        <CalendarIcon class="h-5 w-5 text-muted-foreground" />
      </div>

      <div v-if="getEventsForDate(selectedDate).length === 0" class="text-center py-12">
        <CalendarIcon class="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-30" />
        <p class="text-muted-foreground text-lg mb-2">Aucun événement prévu</p>
        <p class="text-sm text-muted-foreground">Cliquez sur "Nouvel événement" pour en ajouter un</p>
      </div>

      <div v-else class="space-y-4">
        <div
          v-for="event in getEventsForDate(selectedDate)"
          :key="event.id"
          class="border rounded-lg p-6 hover:shadow-lg transition-all"
        >
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-3">
              <Clock class="h-5 w-5 text-primary" />
              <span class="text-lg font-semibold">{{ event.time }}</span>
            </div>
            <Badge variant="secondary" class="px-3 py-1">
              {{ event.matches.length }} match{{ event.matches.length > 1 ? 's' : '' }}
            </Badge>
          </div>

          <Separator class="my-4" />

          <div class="space-y-4">
            <div
              v-for="match in event.matches"
              :key="match.id"
              class="bg-muted/30 rounded-lg p-4 hover:bg-muted/50 transition-colors group"
            >
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-2">
                  <MapPin class="h-4 w-4 text-primary" />
                  <span class="text-sm font-semibold">PISTE {{ match.court }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <Badge :variant="getStatusBadgeVariant(match.status)">
                    {{ getStatusLabel(match.status) }}
                  </Badge>

                  <!-- Dropdown Menu pour les actions -->
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <Button variant="ghost" size="icon" class="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical class="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem @click="viewMatchDetails(match)">
                        <Eye class="h-4 w-4 mr-2" />
                        Voir détails
                      </DropdownMenuItem>
                      <DropdownMenuItem @click="editMatch(match)">
                        <Edit class="h-4 w-4 mr-2" />
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem v-if="match.status === 'A_VENIR'" @click="markAsComplete(match)">
                        <CheckCircle2 class="h-4 w-4 mr-2" />
                        Marquer comme terminé
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem @click="deleteMatch(match.id, event.id)" class="text-destructive">
                        <Trash class="h-4 w-4 mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div class="grid grid-cols-3 gap-4 items-center">
                <!-- Équipe 1 -->
                <div class="space-y-2">
                  <div class="font-semibold text-lg">{{ match.team1.company }}</div>
                  <div class="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users class="h-3 w-3" />
                    <span>{{ match.team1.players.join(' • ') }}</span>
                  </div>
                </div>

                <!-- VS -->
                <div class="text-center">
                  <div class="text-2xl font-bold text-primary">VS</div>
                </div>

                <!-- Équipe 2 -->
                <div class="space-y-2 text-right">
                  <div class="font-semibold text-lg">{{ match.team2.company }}</div>
                  <div class="flex items-center justify-end gap-2 text-sm text-muted-foreground">
                    <span>{{ match.team2.players.join(' • ') }}</span>
                    <Users class="h-3 w-3" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>

    <!-- Message si aucune date sélectionnée -->
    <Card v-else class="p-16 text-center">
      <CalendarIcon class="h-20 w-20 mx-auto mb-4 text-muted-foreground opacity-20" />
      <h3 class="text-xl font-semibold mb-2">Sélectionnez une date</h3>
      <p class="text-muted-foreground">Cliquez sur une date dans le calendrier pour voir les événements prévus</p>
    </Card>
  </div>
</template>
