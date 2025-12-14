<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import {
  Trophy, Calendar, Users, TrendingUp, Clock, MapPin, ChevronRight,
  Award, Building2, Flame, Target, ArrowRight
} from 'lucide-vue-next'
import Card from '../components/ui/card.vue'
import Badge from '../components/ui/badge.vue'
import Button from '../components/ui/button.vue'
import Separator from '../components/ui/separator.vue'
import Progress from '../components/ui/progress.vue'
import { matchesAPI, teamsAPI, eventsAPI, profileAPI } from '@/services/api'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const authStore = useAuthStore()
const { toast } = useToast()

const loading = ref(false)
const stats = ref({
  position: '-',
  points: 0,
  matchesPlayed: 0,
  wins: 0,
  losses: 0,
  winRate: 0,
  streak: 0,
  team: null
})

const upcomingMatches = ref([])
const recentResults = ref([])

// Charger les données du dashboard
const loadDashboard = async () => {
  try {
    loading.value = true

    const [matchesResponse, teamsResponse, eventsResponse] = await Promise.all([
      matchesAPI.getAll(),
      teamsAPI.getAll(),
      eventsAPI.getAll()
    ])

    const matchesData = matchesResponse.data.data || matchesResponse.data
    const teamsData = teamsResponse.data.data || teamsResponse.data
    const eventsData = eventsResponse.data.data || eventsResponse.data

    // Trouver l'équipe de l'utilisateur (simulé pour l'instant)
    // Dans une vraie app, on utiliserait profileAPI pour lier user -> player -> team
    const userTeam = teamsData[0] // Simulé: prendre la première équipe

    if (userTeam) {
      stats.value.team = userTeam

      // Calculer les stats
      const teamMatches = matchesData.filter(m =>
        m.team1?.id === userTeam.id || m.team2?.id === userTeam.id
      )

      const completedMatches = teamMatches.filter(m => m.status === 'TERMINE')

      let wins = 0
      let losses = 0

      completedMatches.forEach(m => {
        const isTeam1 = m.team1?.id === userTeam.id
        const setsWon1 = countSetsWon(m.score_team1)
        const setsWon2 = countSetsWon(m.score_team2)

        if (isTeam1) {
          setsWon1 > setsWon2 ? wins++ : losses++
        } else {
          setsWon2 > setsWon1 ? wins++ : losses++
        }
      })

      stats.value.matchesPlayed = completedMatches.length
      stats.value.wins = wins
      stats.value.losses = losses
      stats.value.winRate = completedMatches.length > 0
        ? Math.round((wins / completedMatches.length) * 100)
        : 0
      stats.value.points = wins * 3

      // Calculer le classement
      const allTeamStats = teamsData.map(team => {
        const matches = matchesData.filter(m =>
          (m.team1?.id === team.id || m.team2?.id === team.id) && m.status === 'TERMINE'
        )
        let teamWins = 0
        matches.forEach(m => {
          const isT1 = m.team1?.id === team.id
          const s1 = countSetsWon(m.score_team1)
          const s2 = countSetsWon(m.score_team2)
          if ((isT1 && s1 > s2) || (!isT1 && s2 > s1)) teamWins++
        })
        return { id: team.id, points: teamWins * 3 }
      }).sort((a, b) => b.points - a.points)

      const position = allTeamStats.findIndex(t => t.id === userTeam.id) + 1
      stats.value.position = position > 0 ? position : '-'

      // Matchs à venir
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      upcomingMatches.value = teamMatches
        .filter(m => {
          const matchDate = new Date(m.event?.date || m.event?.event_date)
          return m.status === 'A_VENIR' && matchDate >= today
        })
        .slice(0, 3)
        .map(m => ({
          id: m.id,
          date: m.event?.date || m.event?.event_date,
          time: m.event?.time || m.event?.event_time,
          court: m.court_number,
          opponent: m.team1?.id === userTeam.id ? m.team2?.company : m.team1?.company,
          pool: m.team1?.pool?.name || 'Poule'
        }))

      // Derniers résultats
      recentResults.value = completedMatches
        .sort((a, b) => new Date(b.event?.date || '2025-01-01') - new Date(a.event?.date || '2025-01-01'))
        .slice(0, 3)
        .map(m => {
          const isTeam1 = m.team1?.id === userTeam.id
          const setsWon1 = countSetsWon(m.score_team1)
          const setsWon2 = countSetsWon(m.score_team2)
          const won = isTeam1 ? setsWon1 > setsWon2 : setsWon2 > setsWon1

          return {
            id: m.id,
            date: m.event?.date || m.event?.event_date,
            opponent: isTeam1 ? m.team2?.company : m.team1?.company,
            score: `${m.score_team1 || '0'} - ${m.score_team2 || '0'}`,
            won
          }
        })
    }
  } catch (error) {
    console.error('Erreur lors du chargement du dashboard:', error)
  } finally {
    loading.value = false
  }
}

const countSetsWon = (scoreStr) => {
  if (!scoreStr) return 0
  return scoreStr.split(',').filter(set => {
    const [s1, s2] = set.trim().split('-').map(Number)
    return s1 > s2
  }).length
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  })
}

onMounted(loadDashboard)
</script>

<template>
  <div class="space-y-6">
    <!-- Welcome Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">
          Bonjour {{ authStore.user?.email?.split('@')[0] }} !
        </h1>
        <p class="text-muted-foreground mt-1">
          Bienvenue sur votre espace Corpo Padel
        </p>
      </div>
      <div v-if="stats.team" class="flex items-center gap-2">
        <Badge variant="outline" class="px-3 py-1">
          <Building2 class="h-3 w-3 mr-1" />
          {{ stats.team.company }}
        </Badge>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card class="p-5 hover:shadow-lg transition-shadow">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm text-muted-foreground">Classement</p>
            <p class="text-3xl font-bold mt-1">
              {{ stats.position === '-' ? '-' : `#${stats.position}` }}
            </p>
          </div>
          <div class="p-2 rounded-lg bg-primary/10">
            <Trophy class="h-5 w-5 text-primary" />
          </div>
        </div>
        <p class="text-xs text-muted-foreground mt-2">sur {{ stats.team ? '12' : '-' }} équipes</p>
      </Card>

      <Card class="p-5 hover:shadow-lg transition-shadow">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm text-muted-foreground">Points</p>
            <p class="text-3xl font-bold mt-1 text-primary">{{ stats.points }}</p>
          </div>
          <div class="p-2 rounded-lg bg-blue-500/10">
            <Target class="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        <p class="text-xs text-muted-foreground mt-2">{{ stats.wins }}V - {{ stats.losses }}D</p>
      </Card>

      <Card class="p-5 hover:shadow-lg transition-shadow">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm text-muted-foreground">Taux victoire</p>
            <p class="text-3xl font-bold mt-1 text-green-600 dark:text-green-400">{{ stats.winRate }}%</p>
          </div>
          <div class="p-2 rounded-lg bg-green-500/10">
            <TrendingUp class="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
        </div>
        <Progress :model-value="stats.winRate" class="h-1.5 mt-3" />
      </Card>

      <Card class="p-5 hover:shadow-lg transition-shadow">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm text-muted-foreground">Matchs joués</p>
            <p class="text-3xl font-bold mt-1">{{ stats.matchesPlayed }}</p>
          </div>
          <div class="p-2 rounded-lg bg-orange-500/10">
            <Flame class="h-5 w-5 text-orange-600 dark:text-orange-400" />
          </div>
        </div>
        <p class="text-xs text-muted-foreground mt-2">cette saison</p>
      </Card>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Prochains matchs -->
      <Card class="p-6">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <Calendar class="h-5 w-5 text-primary" />
            <h2 class="text-lg font-semibold">Prochains matchs</h2>
          </div>
          <Button variant="ghost" size="sm" @click="router.push('/user/matches')" class="gap-1">
            Voir tout
            <ChevronRight class="h-4 w-4" />
          </Button>
        </div>

        <div v-if="upcomingMatches.length === 0" class="text-center py-8">
          <Calendar class="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p class="text-muted-foreground">Aucun match à venir</p>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="match in upcomingMatches"
            :key="match.id"
            class="p-4 rounded-lg border hover:border-primary transition-colors"
          >
            <div class="flex items-center justify-between mb-2">
              <Badge>{{ formatDate(match.date) }}</Badge>
              <div class="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock class="h-3 w-3" />
                {{ match.time }}
              </div>
            </div>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Building2 class="h-4 w-4 text-primary" />
                <span class="font-medium">vs {{ match.opponent }}</span>
              </div>
              <div class="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin class="h-3 w-3" />
                Piste {{ match.court }}
              </div>
            </div>
          </div>
        </div>
      </Card>

      <!-- Derniers résultats -->
      <Card class="p-6">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <Award class="h-5 w-5 text-primary" />
            <h2 class="text-lg font-semibold">Derniers résultats</h2>
          </div>
          <Button variant="ghost" size="sm" @click="router.push('/user/results')" class="gap-1">
            Voir tout
            <ChevronRight class="h-4 w-4" />
          </Button>
        </div>

        <div v-if="recentResults.length === 0" class="text-center py-8">
          <Trophy class="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p class="text-muted-foreground">Aucun match joué</p>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="result in recentResults"
            :key="result.id"
            class="flex items-center gap-4 p-4 rounded-lg border"
          >
            <Badge
              :variant="result.won ? 'default' : 'destructive'"
              class="w-10 h-10 flex items-center justify-center text-lg font-bold"
            >
              {{ result.won ? 'V' : 'D' }}
            </Badge>
            <div class="flex-1">
              <p class="font-medium">vs {{ result.opponent }}</p>
              <p class="text-sm text-muted-foreground">{{ result.score }}</p>
            </div>
            <Badge variant="outline" class="text-xs">{{ formatDate(result.date) }}</Badge>
          </div>
        </div>
      </Card>
    </div>

    <!-- Quick Actions -->
    <Card class="p-6">
      <h2 class="text-lg font-semibold mb-4">Accès rapide</h2>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Button
          variant="outline"
          class="h-auto flex-col gap-2 py-4"
          @click="router.push('/user/matches')"
        >
          <Trophy class="h-6 w-6 text-primary" />
          <span>Mes Matchs</span>
        </Button>
        <Button
          variant="outline"
          class="h-auto flex-col gap-2 py-4"
          @click="router.push('/user/rankings')"
        >
          <Award class="h-6 w-6 text-primary" />
          <span>Classement</span>
        </Button>
        <Button
          variant="outline"
          class="h-auto flex-col gap-2 py-4"
          @click="router.push('/user/calendar')"
        >
          <Calendar class="h-6 w-6 text-primary" />
          <span>Planning</span>
        </Button>
        <Button
          variant="outline"
          class="h-auto flex-col gap-2 py-4"
          @click="router.push('/user/profile')"
        >
          <Users class="h-6 w-6 text-primary" />
          <span>Mon Profil</span>
        </Button>
      </div>
    </Card>
  </div>
</template>
