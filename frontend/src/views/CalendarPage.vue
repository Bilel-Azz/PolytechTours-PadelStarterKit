<script setup>
import { ref, onMounted, computed } from 'vue'
import { Calendar, Clock, MapPin, ChevronLeft, ChevronRight, Users, Trophy, Building2 } from 'lucide-vue-next'
import Card from '../components/ui/card.vue'
import Badge from '../components/ui/badge.vue'
import Button from '../components/ui/button.vue'
import Separator from '../components/ui/separator.vue'
import { eventsAPI, matchesAPI } from '@/services/api'
import { useToast } from '@/composables/useToast'

const { toast } = useToast()

const loading = ref(false)
const events = ref([])
const currentMonth = ref(new Date())

// Charger les événements
const loadEvents = async () => {
  try {
    loading.value = true

    const [eventsResponse, matchesResponse] = await Promise.all([
      eventsAPI.getAll(),
      matchesAPI.getAll()
    ])

    const eventsData = eventsResponse.data.data || eventsResponse.data
    const matchesData = matchesResponse.data.data || matchesResponse.data

    // Combiner events avec leurs matchs
    events.value = eventsData.map(event => {
      const eventMatches = matchesData.filter(m => m.event_id === event.id || m.event?.id === event.id)
      return {
        ...event,
        date: event.event_date || event.eventDate,
        time: event.event_time || event.eventTime,
        matches: eventMatches.map(m => ({
          id: m.id,
          court: m.court_number,
          team1: m.team1?.company || 'TBD',
          team2: m.team2?.company || 'TBD',
          status: m.status,
          score1: m.score_team1,
          score2: m.score_team2
        }))
      }
    }).sort((a, b) => new Date(a.date) - new Date(b.date))

  } catch (error) {
    console.error('Erreur lors du chargement des événements:', error)
    toast.error('Erreur', 'Impossible de charger le planning')
  } finally {
    loading.value = false
  }
}

// Navigation mois
const prevMonth = () => {
  currentMonth.value = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() - 1, 1)
}

const nextMonth = () => {
  currentMonth.value = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() + 1, 1)
}

// Jours du mois
const daysInMonth = computed(() => {
  const year = currentMonth.value.getFullYear()
  const month = currentMonth.value.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  const days = []

  // Jours du mois précédent pour compléter la première semaine
  const startWeekDay = firstDay.getDay() || 7 // Lundi = 1
  for (let i = startWeekDay - 1; i > 0; i--) {
    const d = new Date(year, month, 1 - i)
    days.push({ date: d, isCurrentMonth: false, events: [] })
  }

  // Jours du mois courant
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const d = new Date(year, month, i)
    const dateStr = d.toISOString().split('T')[0]
    const dayEvents = events.value.filter(e => e.date === dateStr)
    days.push({ date: d, isCurrentMonth: true, events: dayEvents })
  }

  // Jours du mois suivant pour compléter la dernière semaine
  const remaining = 42 - days.length // 6 semaines * 7 jours
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i)
    days.push({ date: d, isCurrentMonth: false, events: [] })
  }

  return days
})

// Événements à venir
const upcomingEvents = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return events.value
    .filter(e => new Date(e.date) >= today)
    .slice(0, 5)
})

// Formater la date
const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

const formatMonthYear = (date) => {
  return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

const isToday = (date) => {
  const today = new Date()
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
}

const getStatusColor = (status) => {
  switch (status) {
    case 'TERMINE':
      return 'bg-green-500'
    case 'A_VENIR':
      return 'bg-blue-500'
    case 'ANNULE':
      return 'bg-red-500'
    default:
      return 'bg-gray-500'
  }
}

const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

onMounted(loadEvents)
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-3xl font-bold tracking-tight">Planning</h1>
      <p class="text-muted-foreground mt-1">Calendrier des événements et matchs</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Calendrier -->
      <Card class="lg:col-span-2 p-6">
        <div class="space-y-4">
          <!-- Navigation mois -->
          <div class="flex items-center justify-between">
            <Button variant="outline" size="icon" @click="prevMonth">
              <ChevronLeft class="h-4 w-4" />
            </Button>
            <h2 class="text-xl font-semibold capitalize">{{ formatMonthYear(currentMonth) }}</h2>
            <Button variant="outline" size="icon" @click="nextMonth">
              <ChevronRight class="h-4 w-4" />
            </Button>
          </div>

          <!-- Jours de la semaine -->
          <div class="grid grid-cols-7 gap-1">
            <div
              v-for="day in weekDays"
              :key="day"
              class="text-center py-2 text-sm font-medium text-muted-foreground"
            >
              {{ day }}
            </div>
          </div>

          <!-- Grille des jours -->
          <div class="grid grid-cols-7 gap-1">
            <div
              v-for="(day, index) in daysInMonth"
              :key="index"
              :class="[
                'min-h-[80px] p-2 rounded-lg border transition-colors',
                day.isCurrentMonth ? 'bg-background' : 'bg-muted/30',
                isToday(day.date) ? 'border-primary border-2' : 'border-border',
                day.events.length > 0 ? 'cursor-pointer hover:bg-muted/50' : ''
              ]"
            >
              <div class="flex flex-col h-full">
                <span
                  :class="[
                    'text-sm font-medium',
                    !day.isCurrentMonth && 'text-muted-foreground',
                    isToday(day.date) && 'text-primary font-bold'
                  ]"
                >
                  {{ day.date.getDate() }}
                </span>

                <!-- Indicateurs d'événements -->
                <div class="flex-1 mt-1 space-y-1">
                  <div
                    v-for="event in day.events.slice(0, 2)"
                    :key="event.id"
                    class="text-xs p-1 rounded bg-primary/10 text-primary truncate"
                  >
                    {{ event.time }} - {{ event.matches?.length || 0 }} match(s)
                  </div>
                  <div
                    v-if="day.events.length > 2"
                    class="text-xs text-muted-foreground"
                  >
                    +{{ day.events.length - 2 }} autres
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <!-- Événements à venir -->
      <Card class="p-6">
        <div class="space-y-4">
          <div class="flex items-center gap-2">
            <Calendar class="h-5 w-5 text-primary" />
            <h3 class="text-lg font-semibold">Prochains événements</h3>
          </div>

          <Separator />

          <div v-if="loading" class="text-center py-8">
            <p class="text-muted-foreground">Chargement...</p>
          </div>

          <div v-else-if="upcomingEvents.length === 0" class="text-center py-8">
            <Calendar class="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p class="text-muted-foreground">Aucun événement à venir</p>
          </div>

          <div v-else class="space-y-4">
            <div
              v-for="event in upcomingEvents"
              :key="event.id"
              class="p-4 rounded-lg border hover:border-primary transition-colors"
            >
              <div class="flex items-start justify-between mb-3">
                <div>
                  <p class="font-semibold">{{ formatDate(event.date) }}</p>
                  <div class="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                    <Clock class="h-3 w-3" />
                    {{ event.time }}
                  </div>
                </div>
                <Badge>
                  {{ event.matches?.length || 0 }} match(s)
                </Badge>
              </div>

              <!-- Liste des matchs -->
              <div class="space-y-2">
                <div
                  v-for="match in event.matches?.slice(0, 3)"
                  :key="match.id"
                  class="flex items-center gap-2 text-sm p-2 rounded bg-muted/50"
                >
                  <div :class="['w-2 h-2 rounded-full', getStatusColor(match.status)]"></div>
                  <MapPin class="h-3 w-3 text-muted-foreground" />
                  <span class="text-muted-foreground">P{{ match.court }}</span>
                  <span class="flex-1 truncate">{{ match.team1 }} vs {{ match.team2 }}</span>
                </div>
                <p
                  v-if="event.matches?.length > 3"
                  class="text-xs text-muted-foreground text-center"
                >
                  +{{ event.matches.length - 3 }} match(s) de plus
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>

    <!-- Liste détaillée des événements -->
    <Card class="p-6">
      <div class="space-y-4">
        <div class="flex items-center gap-2">
          <Trophy class="h-5 w-5 text-primary" />
          <h3 class="text-lg font-semibold">Tous les événements</h3>
        </div>

        <Separator />

        <div v-if="events.length === 0" class="text-center py-12">
          <Calendar class="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 class="text-lg font-semibold mb-2">Aucun événement</h3>
          <p class="text-muted-foreground">Le calendrier est vide pour le moment</p>
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="event in events"
            :key="event.id"
            class="p-4 rounded-lg border hover:shadow-md transition-all"
          >
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div class="flex items-center gap-4">
                <div class="p-3 rounded-lg bg-primary/10">
                  <Calendar class="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p class="font-semibold text-lg">{{ formatDate(event.date) }}</p>
                  <div class="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock class="h-4 w-4" />
                    <span>{{ event.time }}</span>
                  </div>
                </div>
              </div>
              <Badge variant="outline" class="w-fit">
                {{ event.matches?.length || 0 }} matchs programmés
              </Badge>
            </div>

            <!-- Grille des matchs -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <div
                v-for="match in event.matches"
                :key="match.id"
                class="p-3 rounded-lg bg-muted/50"
              >
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center gap-2">
                    <MapPin class="h-4 w-4 text-primary" />
                    <span class="font-medium">Piste {{ match.court }}</span>
                  </div>
                  <Badge
                    :variant="match.status === 'TERMINE' ? 'secondary' : match.status === 'ANNULE' ? 'destructive' : 'default'"
                    class="text-xs"
                  >
                    {{ match.status === 'TERMINE' ? 'Terminé' : match.status === 'ANNULE' ? 'Annulé' : 'À venir' }}
                  </Badge>
                </div>
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <Building2 class="h-3 w-3 text-muted-foreground" />
                    <span class="text-sm">{{ match.team1 }}</span>
                  </div>
                  <span class="text-xs text-muted-foreground">vs</span>
                  <div class="flex items-center gap-2">
                    <span class="text-sm">{{ match.team2 }}</span>
                    <Building2 class="h-3 w-3 text-muted-foreground" />
                  </div>
                </div>
                <div v-if="match.status === 'TERMINE' && match.score1" class="mt-2 text-center">
                  <span class="text-sm font-medium">{{ match.score1 }} - {{ match.score2 }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  </div>
</template>
