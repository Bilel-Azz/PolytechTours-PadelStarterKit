<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { Calendar, MapPin, Users, Trophy, Filter, Clock, Building2, ChevronRight, Sparkles } from 'lucide-vue-next'
import Card from '../components/ui/card.vue'
import Badge from '../components/ui/badge.vue'
import Button from '../components/ui/button.vue'
import Select from '../components/ui/select.vue'
import Separator from '../components/ui/separator.vue'

const authStore = useAuthStore()

// Mock data - À remplacer par l'API
const matches = ref([
  {
    id: 1,
    date: '2025-11-28',
    time: '19:30',
    court: 1,
    status: 'A_VENIR',
    team1: {
      company: 'Tech Corp',
      players: ['John Doe', 'Jane Smith'],
      rank: 1
    },
    team2: {
      company: 'Innov Ltd',
      players: ['Alice Martin', 'Bob Dupont'],
      rank: 3
    },
    pool: 'Poule A',
    score: null
  },
  {
    id: 2,
    date: '2025-11-28',
    time: '20:00',
    court: 2,
    status: 'A_VENIR',
    team1: {
      company: 'StartCo',
      players: ['Charlie Brown', 'Diana Prince'],
      rank: 4
    },
    team2: {
      company: 'DevHub',
      players: ['Eve Adams', 'Frank Wilson'],
      rank: 2
    },
    pool: 'Poule A',
    score: null
  },
  {
    id: 3,
    date: '2025-11-22',
    time: '19:30',
    court: 1,
    status: 'TERMINE',
    team1: {
      company: 'Tech Corp',
      players: ['John Doe', 'Jane Smith'],
      rank: 1,
      setsWon: 2
    },
    team2: {
      company: 'Innov Ltd',
      players: ['Alice Martin', 'Bob Dupont'],
      rank: 3,
      setsWon: 0
    },
    pool: 'Poule A',
    score: '6-4, 6-3'
  },
  {
    id: 4,
    date: '2025-11-15',
    time: '20:00',
    court: 3,
    status: 'TERMINE',
    team1: {
      company: 'StartCo',
      players: ['Charlie Brown', 'Diana Prince'],
      rank: 4,
      setsWon: 1
    },
    team2: {
      company: 'Tech Corp',
      players: ['John Doe', 'Jane Smith'],
      rank: 1,
      setsWon: 2
    },
    pool: 'Poule A',
    score: '6-4, 3-6, 7-5'
  },
  {
    id: 5,
    date: '2025-11-10',
    time: '19:30',
    court: 2,
    status: 'ANNULE',
    team1: {
      company: 'DevHub',
      players: ['Eve Adams', 'Frank Wilson'],
      rank: 2
    },
    team2: {
      company: 'Innov Ltd',
      players: ['Alice Martin', 'Bob Dupont'],
      rank: 3
    },
    pool: 'Poule A',
    score: null
  }
])

const filterStatus = ref('ALL')
const filterPool = ref('ALL')
const sortBy = ref('date')

const statusOptions = [
  { value: 'ALL', label: 'Tous les statuts' },
  { value: 'A_VENIR', label: 'À venir' },
  { value: 'TERMINE', label: 'Terminés' },
  { value: 'ANNULE', label: 'Annulés' }
]

const poolOptions = [
  { value: 'ALL', label: 'Toutes les poules' },
  { value: 'Poule A', label: 'Poule A' },
  { value: 'Poule B', label: 'Poule B' }
]

const sortOptions = [
  { value: 'date', label: 'Par date' },
  { value: 'court', label: 'Par piste' },
  { value: 'status', label: 'Par statut' }
]

const filteredMatches = computed(() => {
  let filtered = matches.value

  if (filterStatus.value !== 'ALL') {
    filtered = filtered.filter(m => m.status === filterStatus.value)
  }

  if (filterPool.value !== 'ALL') {
    filtered = filtered.filter(m => m.pool === filterPool.value)
  }

  // Sort
  return filtered.sort((a, b) => {
    if (sortBy.value === 'date') {
      return new Date(b.date) - new Date(a.date)
    } else if (sortBy.value === 'court') {
      return a.court - b.court
    }
    return 0
  })
})

const stats = computed(() => {
  return {
    total: matches.value.length,
    upcoming: matches.value.filter(m => m.status === 'A_VENIR').length,
    completed: matches.value.filter(m => m.status === 'TERMINE').length,
    cancelled: matches.value.filter(m => m.status === 'ANNULE').length
  }
})

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

const formatDate = (dateStr) => {
  const date = new Date(dateStr + 'T00:00:00')
  const options = { weekday: 'short', day: 'numeric', month: 'short' }
  return date.toLocaleDateString('fr-FR', options)
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header with Stats -->
    <div class="space-y-4">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Matchs</h1>
        <p class="text-muted-foreground mt-1">Consultez et suivez tous les matchs de la saison</p>
      </div>

      <!-- Quick Stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card class="p-4 border-l-4 border-l-primary">
          <div class="space-y-1">
            <p class="text-sm text-muted-foreground">Total</p>
            <p class="text-2xl font-bold">{{ stats.total }}</p>
          </div>
        </Card>
        <Card class="p-4 border-l-4 border-l-blue-500">
          <div class="space-y-1">
            <p class="text-sm text-muted-foreground">À venir</p>
            <p class="text-2xl font-bold text-blue-600">{{ stats.upcoming }}</p>
          </div>
        </Card>
        <Card class="p-4 border-l-4 border-l-green-500">
          <div class="space-y-1">
            <p class="text-sm text-muted-foreground">Terminés</p>
            <p class="text-2xl font-bold text-green-600">{{ stats.completed }}</p>
          </div>
        </Card>
        <Card class="p-4 border-l-4 border-l-red-500">
          <div class="space-y-1">
            <p class="text-sm text-muted-foreground">Annulés</p>
            <p class="text-2xl font-bold text-red-600">{{ stats.cancelled }}</p>
          </div>
        </Card>
      </div>
    </div>

    <!-- Advanced Filters -->
    <Card class="p-6">
      <div class="space-y-4">
        <div class="flex items-center gap-2">
          <Filter class="h-5 w-5 text-primary" />
          <h3 class="font-semibold">Filtres et tri</h3>
        </div>
        <Separator />
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="space-y-2">
            <label class="text-sm font-medium">Statut</label>
            <Select v-model="filterStatus" :options="statusOptions" placeholder="Choisir un statut" />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium">Poule</label>
            <Select v-model="filterPool" :options="poolOptions" placeholder="Choisir une poule" />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium">Tri</label>
            <Select v-model="sortBy" :options="sortOptions" placeholder="Trier par" />
          </div>
        </div>
      </div>
    </Card>

    <!-- Matches List -->
    <div class="space-y-4">
      <Card
        v-for="match in filteredMatches"
        :key="match.id"
        class="overflow-hidden hover:shadow-lg transition-all duration-300 group"
      >
        <div class="p-6 space-y-4">
          <!-- Match Header -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-6">
              <div class="flex flex-col items-center gap-1 min-w-[80px]">
                <div class="text-xs text-muted-foreground uppercase tracking-wide">{{ formatDate(match.date) }}</div>
                <div class="flex items-center gap-1 text-sm font-medium">
                  <Clock class="h-3 w-3" />
                  {{ match.time }}
                </div>
              </div>
              <Separator orientation="vertical" class="h-10" />
              <div class="flex items-center gap-2">
                <MapPin class="h-4 w-4 text-primary" />
                <span class="font-medium">Piste {{ match.court }}</span>
              </div>
              <Badge variant="outline">{{ match.pool }}</Badge>
            </div>
            <Badge :variant="getStatusBadgeVariant(match.status)" class="px-3 py-1">
              {{ getStatusLabel(match.status) }}
            </Badge>
          </div>

          <Separator />

          <!-- Teams Matchup -->
          <div class="grid grid-cols-5 gap-4 items-center">
            <!-- Team 1 -->
            <div class="col-span-2 space-y-3 p-4 rounded-lg bg-muted/30 group-hover:bg-muted/50 transition-colors">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <Building2 class="h-4 w-4 text-primary" />
                  <span class="font-bold text-lg">{{ match.team1.company }}</span>
                </div>
                <Badge variant="outline" class="text-xs">#{match.team1.rank}</Badge>
              </div>
              <div class="flex items-center gap-2 text-sm text-muted-foreground">
                <Users class="h-3 w-3" />
                <span>{{ match.team1.players.join(' • ') }}</span>
              </div>
              <div v-if="match.status === 'TERMINE' && match.team1.setsWon !== undefined" class="flex items-center gap-2">
                <Sparkles class="h-4 w-4 text-yellow-500" />
                <span class="text-sm font-medium">{{ match.team1.setsWon }} sets gagnés</span>
              </div>
            </div>

            <!-- VS / Score -->
            <div class="col-span-1 flex flex-col items-center justify-center">
              <div v-if="match.score" class="text-center space-y-2">
                <Trophy class="h-6 w-6 mx-auto text-primary" />
                <div class="text-2xl font-bold">{{ match.score }}</div>
              </div>
              <div v-else class="relative">
                <div class="absolute inset-0 bg-primary/10 blur-xl rounded-full"></div>
                <div class="relative text-3xl font-bold text-primary">VS</div>
              </div>
            </div>

            <!-- Team 2 -->
            <div class="col-span-2 space-y-3 p-4 rounded-lg bg-muted/30 group-hover:bg-muted/50 transition-colors">
              <div class="flex items-center justify-between">
                <Badge variant="outline" class="text-xs">#{match.team2.rank}</Badge>
                <div class="flex items-center gap-2">
                  <span class="font-bold text-lg">{{ match.team2.company }}</span>
                  <Building2 class="h-4 w-4 text-primary" />
                </div>
              </div>
              <div class="flex items-center justify-end gap-2 text-sm text-muted-foreground">
                <span>{{ match.team2.players.join(' • ') }}</span>
                <Users class="h-3 w-3" />
              </div>
              <div v-if="match.status === 'TERMINE' && match.team2.setsWon !== undefined" class="flex items-center justify-end gap-2">
                <span class="text-sm font-medium">{{ match.team2.setsWon }} sets gagnés</span>
                <Sparkles class="h-4 w-4 text-yellow-500" />
              </div>
            </div>
          </div>

          <!-- Action Button -->
          <div class="flex justify-end pt-2">
            <Button variant="ghost" size="sm" class="gap-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <span>Voir détails</span>
              <ChevronRight class="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      <!-- Empty State -->
      <Card v-if="filteredMatches.length === 0" class="p-16 text-center">
        <Trophy class="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 class="text-lg font-semibold mb-2">Aucun match trouvé</h3>
        <p class="text-muted-foreground">Essayez de modifier vos filtres pour voir plus de résultats</p>
      </Card>
    </div>
  </div>
</template>
