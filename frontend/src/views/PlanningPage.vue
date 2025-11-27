<script setup>
import { ref, computed } from 'vue'
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon } from 'lucide-vue-next'
import Button from '../components/ui/button.vue'
import Card from '../components/ui/card.vue'
import Badge from '../components/ui/badge.vue'

// État du calendrier
const currentDate = ref(new Date())
const selectedDate = ref(null)
const showEventDialog = ref(false)

// Mock data - À remplacer par l'API
const events = ref([
  {
    id: 1,
    date: '2025-11-15',
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
    date: '2025-11-22',
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

  // Ajuster pour commencer le lundi (0 = dimanche, 1 = lundi)
  const startDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1

  const days = []

  // Jours du mois précédent
  const prevMonthLastDay = new Date(year, month, 0).getDate()
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    days.push({
      day: prevMonthLastDay - i,
      isCurrentMonth: false,
      date: new Date(year, month - 1, prevMonthLastDay - i)
    })
  }

  // Jours du mois actuel
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push({
      day: i,
      isCurrentMonth: true,
      date: new Date(year, month, i)
    })
  }

  // Jours du mois suivant pour compléter la grille
  const remainingDays = 42 - days.length // 6 semaines * 7 jours
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
      return 'success'
    case 'ANNULE':
      return 'destructive'
    default:
      return 'secondary'
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
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Planning</h1>
        <p class="text-gray-500 mt-1">Visualisez tous les événements de la saison</p>
      </div>
      <Button class="gap-2">
        <Plus class="h-4 w-4" />
        Nouvel événement
      </Button>
    </div>

    <!-- Calendrier -->
    <Card class="p-6">
      <!-- Navigation du mois -->
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-semibold text-gray-900">
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
          class="text-center text-sm font-medium text-gray-500 py-2"
        >
          {{ day }}
        </div>

        <!-- Jours du calendrier -->
        <button
          v-for="(dayObj, index) in calendarDays"
          :key="index"
          @click="selectDate(dayObj)"
          :class="[
            'relative aspect-square rounded-lg p-2 text-sm transition-colors',
            dayObj.isCurrentMonth
              ? 'text-gray-900 hover:bg-gray-100'
              : 'text-gray-400',
            isToday(dayObj.date)
              ? 'bg-indigo-50 font-bold text-indigo-600 ring-2 ring-indigo-600'
              : '',
            selectedDate && formatDate(selectedDate) === formatDate(dayObj.date)
              ? 'bg-indigo-100 ring-2 ring-indigo-400'
              : ''
          ]"
        >
          <span>{{ dayObj.day }}</span>
          <!-- Indicateur d'événement -->
          <span
            v-if="hasEvents(dayObj.date) && dayObj.isCurrentMonth"
            class="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-indigo-600 rounded-full"
          />
        </button>
      </div>
    </Card>

    <!-- Détails de la date sélectionnée -->
    <Card v-if="selectedDate" class="p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-900">
          Événements du {{ formatDateReadable(formatDate(selectedDate)) }}
        </h3>
        <CalendarIcon class="h-5 w-5 text-gray-400" />
      </div>

      <div v-if="getEventsForDate(selectedDate).length === 0" class="text-center py-8 text-gray-500">
        <CalendarIcon class="h-12 w-12 mx-auto mb-3 text-gray-300" />
        <p>Aucun événement prévu pour cette date</p>
      </div>

      <div v-else class="space-y-4">
        <div
          v-for="event in getEventsForDate(selectedDate)"
          :key="event.id"
          class="border border-gray-200 rounded-lg p-4"
        >
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm font-medium text-gray-900">
              🕐 {{ event.time }}
            </span>
            <Badge variant="secondary">{{ event.matches.length }} match{{ event.matches.length > 1 ? 's' : '' }}</Badge>
          </div>

          <div class="space-y-3">
            <div
              v-for="match in event.matches"
              :key="match.id"
              class="bg-gray-50 rounded-lg p-3"
            >
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-semibold text-gray-500">PISTE {{ match.court }}</span>
                <Badge :variant="getStatusBadgeVariant(match.status)">
                  {{ getStatusLabel(match.status) }}
                </Badge>
              </div>

              <div class="space-y-2">
                <!-- Équipe 1 -->
                <div class="flex items-center justify-between">
                  <div>
                    <div class="font-medium text-sm text-gray-900">{{ match.team1.company }}</div>
                    <div class="text-xs text-gray-500">{{ match.team1.players.join(' / ') }}</div>
                  </div>
                </div>

                <div class="text-center text-xs font-semibold text-gray-400">VS</div>

                <!-- Équipe 2 -->
                <div class="flex items-center justify-between">
                  <div>
                    <div class="font-medium text-sm text-gray-900">{{ match.team2.company }}</div>
                    <div class="text-xs text-gray-500">{{ match.team2.players.join(' / ') }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>

    <!-- Message si aucune date sélectionnée -->
    <Card v-else class="p-12 text-center">
      <CalendarIcon class="h-12 w-12 mx-auto mb-3 text-gray-300" />
      <p class="text-gray-500">Sélectionnez une date dans le calendrier pour voir les événements</p>
    </Card>
  </div>
</template>
