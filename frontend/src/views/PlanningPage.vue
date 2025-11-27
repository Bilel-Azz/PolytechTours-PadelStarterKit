<script setup>
import { ref, computed } from 'vue'
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

const { toast } = useToast()

// État du calendrier
const currentDate = ref(new Date())
const selectedDate = ref(null)
const showEventDialog = ref(false)
const showEditDialog = ref(false)
const editingEvent = ref(null)

// Form state
const newEvent = ref({
  date: '',
  time: '',
  court: 1,
  team1Company: '',
  team1Players: '',
  team2Company: '',
  team2Players: ''
})

// Mock data - À remplacer par l'API
const events = ref([
  {
    id: 1,
    date: '2025-11-28',
    time: '19:30',
    matches: [
      {
        id: 1,
        court: 1,
        team1: { company: 'Tech Corp', players: ['John Doe', 'Jane Smith'] },
        team2: { company: 'Innov Ltd', players: ['Alice Martin', 'Bob Dupont'] },
        status: 'A_VENIR'
      },
      {
        id: 2,
        court: 2,
        team1: { company: 'StartCo', players: ['Charlie Brown', 'Diana Prince'] },
        team2: { company: 'DevHub', players: ['Eve Adams', 'Frank Wilson'] },
        status: 'A_VENIR'
      }
    ]
  },
  {
    id: 2,
    date: '2025-11-29',
    time: '20:00',
    matches: [
      {
        id: 3,
        court: 1,
        team1: { company: 'Tech Corp', players: ['John Doe', 'Jane Smith'] },
        team2: { company: 'StartCo', players: ['Charlie Brown', 'Diana Prince'] },
        status: 'A_VENIR'
      }
    ]
  }
])

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
const addEvent = () => {
  if (!newEvent.value.date || !newEvent.value.time) {
    toast.error('Erreur', 'Veuillez remplir tous les champs obligatoires')
    return
  }

  const eventData = {
    id: Date.now(),
    date: newEvent.value.date,
    time: newEvent.value.time,
    matches: [{
      id: Date.now(),
      court: newEvent.value.court,
      team1: {
        company: newEvent.value.team1Company,
        players: newEvent.value.team1Players.split(',').map(p => p.trim())
      },
      team2: {
        company: newEvent.value.team2Company,
        players: newEvent.value.team2Players.split(',').map(p => p.trim())
      },
      status: 'A_VENIR'
    }]
  }

  events.value.push(eventData)
  showEventDialog.value = false

  // Reset form
  newEvent.value = {
    date: '',
    time: '',
    court: 1,
    team1Company: '',
    team1Players: '',
    team2Company: '',
    team2Players: ''
  }

  toast.success('Événement créé', 'L\'événement a été ajouté au planning')
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

const deleteMatch = (matchId, eventId) => {
  const eventIndex = events.value.findIndex(e => e.id === eventId)
  if (eventIndex !== -1) {
    const matchIndex = events.value[eventIndex].matches.findIndex(m => m.id === matchId)
    if (matchIndex !== -1) {
      events.value[eventIndex].matches.splice(matchIndex, 1)

      // Si plus de matchs, supprimer l'événement
      if (events.value[eventIndex].matches.length === 0) {
        events.value.splice(eventIndex, 1)
      }

      toast.success('Match supprimé', 'Le match a été supprimé du planning')
    }
  }
}

const markAsComplete = (match) => {
  match.status = 'TERMINE'
  toast.success('Match terminé', `${match.team1.company} vs ${match.team2.company} marqué comme terminé`)
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

            <div class="space-y-4">
              <h4 class="text-sm font-semibold">Équipe 1</h4>
              <div class="space-y-2">
                <Label for="team1-company">Entreprise</Label>
                <Input id="team1-company" v-model="newEvent.team1Company" placeholder="Tech Corp" />
              </div>
              <div class="space-y-2">
                <Label for="team1-players">Joueurs (séparés par des virgules)</Label>
                <Input id="team1-players" v-model="newEvent.team1Players" placeholder="John Doe, Jane Smith" />
              </div>
            </div>

            <Separator />

            <div class="space-y-4">
              <h4 class="text-sm font-semibold">Équipe 2</h4>
              <div class="space-y-2">
                <Label for="team2-company">Entreprise</Label>
                <Input id="team2-company" v-model="newEvent.team2Company" placeholder="Innov Ltd" />
              </div>
              <div class="space-y-2">
                <Label for="team2-players">Joueurs (séparés par des virgules)</Label>
                <Input id="team2-players" v-model="newEvent.team2Players" placeholder="Alice Martin, Bob Dupont" />
              </div>
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
