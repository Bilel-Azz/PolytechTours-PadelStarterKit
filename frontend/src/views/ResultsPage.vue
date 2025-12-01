<script setup>
import { ref, onMounted, computed } from 'vue'
import { Trophy, TrendingUp, Medal, Award, Target, Zap, Flame, Star, Crown, ChevronUp, ChevronDown } from 'lucide-vue-next'
import Card from '../components/ui/card.vue'
import Badge from '../components/ui/badge.vue'
import Separator from '../components/ui/separator.vue'
import Progress from '../components/ui/progress.vue'
import { matchesAPI, teamsAPI } from '@/services/api'
import { useAuthStore } from '../stores/auth'
import { useToast } from '@/composables/useToast'

const authStore = useAuthStore()
const { toast } = useToast()

// Data from API
const rankings = ref([])
const myStats = ref({
  company: '',
  position: 0,
  points: 0,
  played: 0,
  won: 0,
  lost: 0,
  winRate: 0,
  streak: 0,
  lastMatches: [],
  achievements: []
})
const loading = ref(false)

// Charger les résultats et classements depuis l'API
const loadResults = async () => {
  try {
    loading.value = true
    const [matchesResponse, teamsResponse] = await Promise.all([
      matchesAPI.getAll(),
      teamsAPI.getAll()
    ])

    const matchesData = matchesResponse.data.data || matchesResponse.data
    const teamsData = teamsResponse.data.data || teamsResponse.data

    // Calculer les classements à partir des matchs et équipes
    const teamStats = calculateTeamStats(matchesData, teamsData)
    rankings.value = teamStats.sort((a, b) => b.points - a.points)
      .map((team, index) => ({
        ...team,
        position: index + 1
      }))

    // Récupérer les stats de l'utilisateur courant
    const userTeam = rankings.value.find(t => t.company === authStore.user?.company)
    if (userTeam) {
      const userMatches = matchesData
        .filter(m => m.team1?.company === userTeam.company || m.team2?.company === userTeam.company)
        .filter(m => m.status === 'TERMINE')
        .sort((a, b) => new Date(b.event?.date || '2025-01-01') - new Date(a.event?.date || '2025-01-01'))
        .slice(0, 4)

      myStats.value = {
        company: userTeam.company,
        position: userTeam.position,
        points: userTeam.points,
        played: userTeam.played,
        won: userTeam.won,
        lost: userTeam.lost,
        winRate: userTeam.winRate,
        streak: calculateStreak(matchesData, userTeam.company),
        lastMatches: userMatches.map(match => {
          const isTeam1 = match.team1?.company === userTeam.company
          const setsWon1 = calculateSetsWonFromScore(match.score_team1)
          const setsWon2 = calculateSetsWonFromScore(match.score_team2)
          const won = isTeam1 ? (setsWon1 > setsWon2) : (setsWon2 > setsWon1)
          return {
            result: won ? 'W' : 'L',
            opponent: isTeam1 ? match.team2?.company : match.team1?.company,
            score: formatMatchScore(match.score_team1, match.score_team2) || 'N/A',
            date: new Date(match.event?.date || '2025-01-01').toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
          }
        }),
        achievements: [
          { name: 'Série de victoires', value: `${calculateStreak(matchesData, userTeam.company)} matchs`, icon: Flame },
          { name: 'Meilleur score', value: getBestScore(matchesData, userTeam.company), icon: Star },
          { name: 'Classement', value: `${userTeam.position}ère place`, icon: Crown }
        ]
      }
    }
  } catch (error) {
    console.error('Erreur lors du chargement des résultats:', error)
    toast.error('Erreur', 'Impossible de charger les résultats')
  } finally {
    loading.value = false
  }
}

// Calculer le nombre de sets gagnés depuis un score
const calculateSetsWonFromScore = (scoreStr) => {
  if (!scoreStr) return 0
  const sets = scoreStr.split(',').map(s => s.trim())
  return sets.filter(set => {
    const [score1, score2] = set.split('-').map(Number)
    return score1 > score2
  }).length
}

// Formater le score du match
const formatMatchScore = (score1, score2) => {
  if (!score1 || !score2) return null
  const sets1 = score1.split(',').map(s => s.trim())
  const sets2 = score2.split(',').map(s => s.trim())
  return sets1.map((s, i) => `${s}-${sets2[i] || '0'}`).join(', ')
}

// Calculer les statistiques d'équipe
const calculateTeamStats = (matches, teams) => {
  const stats = {}

  // Initialiser les stats pour chaque équipe
  teams.forEach(team => {
    stats[team.company] = {
      company: team.company,
      points: 0,
      played: 0,
      won: 0,
      lost: 0,
      setDiff: 0,
      winRate: 0,
      trend: 'stable'
    }
  })

  // Compter les matchs terminés
  matches.filter(m => m.status === 'TERMINE').forEach(match => {
    const team1Name = match.team1?.company
    const team2Name = match.team2?.company

    if (team1Name && stats[team1Name]) {
      stats[team1Name].played++
      const setsWon = calculateSetsWonFromScore(match.score_team1)
      const setsLost = calculateSetsWonFromScore(match.score_team2)
      stats[team1Name].setDiff += (setsWon - setsLost)

      if (setsWon > setsLost) {
        stats[team1Name].won++
        stats[team1Name].points += 3
      } else {
        stats[team1Name].lost++
      }
    }

    if (team2Name && stats[team2Name]) {
      stats[team2Name].played++
      const setsWon = calculateSetsWonFromScore(match.score_team2)
      const setsLost = calculateSetsWonFromScore(match.score_team1)
      stats[team2Name].setDiff += (setsWon - setsLost)

      if (setsWon > setsLost) {
        stats[team2Name].won++
        stats[team2Name].points += 3
      } else {
        stats[team2Name].lost++
      }
    }
  })

  // Calculer le taux de victoire et formatter setDiff
  Object.values(stats).forEach(team => {
    team.winRate = team.played > 0 ? Math.round((team.won / team.played) * 100) : 0
    team.setDiff = team.setDiff > 0 ? `+${team.setDiff}` : `${team.setDiff}`
  })

  return Object.values(stats)
}

// Calculer la série de victoires
const calculateStreak = (matches, teamName) => {
  const teamMatches = matches
    .filter(m => (m.team1?.company === teamName || m.team2?.company === teamName) && m.status === 'TERMINE')
    .sort((a, b) => new Date(b.event?.date || '2025-01-01') - new Date(a.event?.date || '2025-01-01'))

  let streak = 0
  for (const match of teamMatches) {
    const isTeam1 = match.team1?.company === teamName
    const setsWon1 = calculateSetsWonFromScore(match.score_team1)
    const setsWon2 = calculateSetsWonFromScore(match.score_team2)
    const won = isTeam1 ? (setsWon1 > setsWon2) : (setsWon2 > setsWon1)
    if (won) {
      streak++
    } else {
      break
    }
  }
  return streak
}

// Obtenir le meilleur score
const getBestScore = (matches, teamName) => {
  const teamMatches = matches
    .filter(m => (m.team1?.company === teamName || m.team2?.company === teamName) && m.status === 'TERMINE' && (m.score_team1 || m.score_team2))

  if (teamMatches.length === 0) return 'N/A'

  const bestMatch = teamMatches[0]
  return formatMatchScore(bestMatch.score_team1, bestMatch.score_team2) || 'N/A'
}

// Charger les données au montage
onMounted(() => {
  loadResults()
})

const getMedalComponent = (position) => {
  switch (position) {
    case 1:
      return { icon: Trophy, class: 'text-yellow-600 dark:text-yellow-400 bg-yellow-500/10' }
    case 2:
      return { icon: Medal, class: 'text-muted-foreground bg-muted' }
    case 3:
      return { icon: Award, class: 'text-amber-600 dark:text-amber-400 bg-amber-500/10' }
    default:
      return null
  }
}

const getTrendIcon = (trend) => {
  switch (trend) {
    case 'up':
      return { icon: ChevronUp, class: 'text-green-600 dark:text-green-400' }
    case 'down':
      return { icon: ChevronDown, class: 'text-red-600 dark:text-red-400' }
    default:
      return null
  }
}

const getResultBadge = (result) => {
  return result === 'W' ? 'default' : 'destructive'
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-3xl font-bold tracking-tight">Résultats & Classement</h1>
      <p class="text-muted-foreground mt-1">Suivez vos performances et le classement général</p>
    </div>

    <!-- My Performance Overview -->
    <div class="space-y-4">
      <div class="flex items-center gap-2">
        <Target class="h-5 w-5 text-primary" />
        <h2 class="text-xl font-semibold">Mes performances</h2>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card class="p-6 relative overflow-hidden group hover:shadow-lg transition-all">
          <div class="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors"></div>
          <div class="relative space-y-2">
            <div class="flex items-center justify-between">
              <Trophy class="h-8 w-8 text-primary" />
              <Badge variant="secondary">Classement</Badge>
            </div>
            <p class="text-3xl font-bold">#{{ myStats.position }}</p>
            <p class="text-sm text-muted-foreground">{{ myStats.company }}</p>
          </div>
        </Card>

        <Card class="p-6 relative overflow-hidden group hover:shadow-lg transition-all">
          <div class="absolute top-0 right-0 w-32 h-32 bg-green-500/5 dark:bg-green-500/10 rounded-full -mr-16 -mt-16 group-hover:bg-green-500/10 dark:group-hover:bg-green-500/20 transition-colors"></div>
          <div class="relative space-y-2">
            <div class="flex items-center justify-between">
              <TrendingUp class="h-8 w-8 text-green-600 dark:text-green-400" />
              <Badge>Taux victoire</Badge>
            </div>
            <p class="text-3xl font-bold text-green-600 dark:text-green-400">{{ myStats.winRate }}%</p>
            <Progress :model-value="myStats.winRate" class="h-2" />
          </div>
        </Card>

        <Card class="p-6 relative overflow-hidden group hover:shadow-lg transition-all">
          <div class="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 dark:bg-blue-500/10 rounded-full -mr-16 -mt-16 group-hover:bg-blue-500/10 dark:group-hover:bg-blue-500/20 transition-colors"></div>
          <div class="relative space-y-2">
            <div class="flex items-center justify-between">
              <Zap class="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <Badge variant="outline">Points</Badge>
            </div>
            <p class="text-3xl font-bold text-blue-600 dark:text-blue-400">{{ myStats.points }}</p>
            <p class="text-sm text-muted-foreground">{{ myStats.won }}V - {{ myStats.lost }}D</p>
          </div>
        </Card>

        <Card class="p-6 relative overflow-hidden group hover:shadow-lg transition-all">
          <div class="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 dark:bg-orange-500/10 rounded-full -mr-16 -mt-16 group-hover:bg-orange-500/10 dark:group-hover:bg-orange-500/20 transition-colors"></div>
          <div class="relative space-y-2">
            <div class="flex items-center justify-between">
              <Flame class="h-8 w-8 text-orange-600 dark:text-orange-400" />
              <Badge variant="destructive">Série</Badge>
            </div>
            <p class="text-3xl font-bold text-orange-600 dark:text-orange-400">{{ myStats.streak }}</p>
            <p class="text-sm text-muted-foreground">matchs d'affilée</p>
          </div>
        </Card>
      </div>
    </div>

    <!-- Achievements & Last Matches -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Achievements -->
      <Card class="p-6">
        <div class="space-y-4">
          <div class="flex items-center gap-2">
            <Award class="h-5 w-5 text-primary" />
            <h3 class="text-lg font-semibold">Accomplissements</h3>
          </div>
          <Separator />
          <div class="space-y-3">
            <div
              v-for="(achievement, index) in myStats.achievements"
              :key="index"
              class="flex items-center gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <div class="p-2 rounded-full bg-primary/10">
                <component :is="achievement.icon" class="h-5 w-5 text-primary" />
              </div>
              <div class="flex-1">
                <p class="font-medium">{{ achievement.name }}</p>
                <p class="text-sm text-muted-foreground">{{ achievement.value }}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <!-- Last Matches -->
      <Card class="p-6">
        <div class="space-y-4">
          <div class="flex items-center gap-2">
            <Trophy class="h-5 w-5 text-primary" />
            <h3 class="text-lg font-semibold">Derniers matchs</h3>
          </div>
          <Separator />
          <div class="space-y-2">
            <div
              v-for="(match, index) in myStats.lastMatches"
              :key="index"
              class="flex items-center gap-4 p-3 rounded-lg border hover:border-primary transition-colors"
            >
              <Badge :variant="getResultBadge(match.result)" class="w-12 h-12 flex items-center justify-center text-lg font-bold">
                {{ match.result }}
              </Badge>
              <div class="flex-1">
                <p class="font-medium">vs {{ match.opponent }}</p>
                <p class="text-sm text-muted-foreground">{{ match.score }}</p>
              </div>
              <Badge variant="outline" class="text-xs">{{ match.date }}</Badge>
            </div>
          </div>
        </div>
      </Card>
    </div>

    <!-- Rankings Table -->
    <Card class="p-6">
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Trophy class="h-5 w-5 text-primary" />
            <h2 class="text-xl font-semibold">Classement général</h2>
          </div>
          <Badge variant="outline">Saison 2025</Badge>
        </div>
        <Separator />
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b">
                <th class="text-left py-3 px-4 font-semibold">Pos</th>
                <th class="text-left py-3 px-4 font-semibold">Équipe</th>
                <th class="text-center py-3 px-4 font-semibold">Pts</th>
                <th class="text-center py-3 px-4 font-semibold">J</th>
                <th class="text-center py-3 px-4 font-semibold">V</th>
                <th class="text-center py-3 px-4 font-semibold">D</th>
                <th class="text-center py-3 px-4 font-semibold">Diff</th>
                <th class="text-center py-3 px-4 font-semibold">%</th>
                <th class="text-center py-3 px-4 font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="team in rankings"
                :key="team.position"
                :class="[
                  'border-b transition-all hover:bg-muted/50',
                  team.company === myStats.company ? 'bg-primary/5 hover:bg-primary/10' : ''
                ]"
              >
                <td class="py-4 px-4">
                  <div class="flex items-center gap-2">
                    <div v-if="getMedalComponent(team.position)" class="p-2 rounded-full" :class="getMedalComponent(team.position).class">
                      <component :is="getMedalComponent(team.position).icon" class="h-4 w-4" :class="getMedalComponent(team.position).class.split(' ')[0]" />
                    </div>
                    <span v-else class="w-8 text-center font-bold">{{ team.position }}</span>
                  </div>
                </td>
                <td class="py-4 px-4">
                  <div class="flex items-center gap-2">
                    <span class="font-semibold">{{ team.company }}</span>
                    <Badge v-if="team.company === myStats.company" variant="default" class="text-xs">Vous</Badge>
                  </div>
                </td>
                <td class="py-4 px-4 text-center">
                  <span class="font-bold text-lg">{{ team.points }}</span>
                </td>
                <td class="py-4 px-4 text-center text-muted-foreground">{{ team.played }}</td>
                <td class="py-4 px-4 text-center">
                  <Badge variant="outline" class="bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">{{ team.won }}</Badge>
                </td>
                <td class="py-4 px-4 text-center">
                  <Badge variant="outline" class="bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800">{{ team.lost }}</Badge>
                </td>
                <td class="py-4 px-4 text-center">
                  <span :class="team.setDiff.startsWith('+') ? 'text-green-600 dark:text-green-400 font-semibold' : 'text-red-600 dark:text-red-400 font-semibold'">
                    {{ team.setDiff }}
                  </span>
                </td>
                <td class="py-4 px-4 text-center">
                  <div class="flex flex-col items-center gap-1">
                    <span class="text-sm font-medium">{{ team.winRate }}%</span>
                    <Progress :model-value="team.winRate" class="h-1 w-16" />
                  </div>
                </td>
                <td class="py-4 px-4 text-center">
                  <component
                    v-if="getTrendIcon(team.trend)"
                    :is="getTrendIcon(team.trend).icon"
                    :class="['h-5 w-5', getTrendIcon(team.trend).class]"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  </div>
</template>
