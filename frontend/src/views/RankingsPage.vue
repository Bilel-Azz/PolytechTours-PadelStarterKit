<script setup>
import { ref, onMounted, computed } from 'vue'
import { Trophy, Medal, Award, TrendingUp, Building2, Users, Filter, Search } from 'lucide-vue-next'
import Card from '../components/ui/card.vue'
import Badge from '../components/ui/badge.vue'
import Input from '../components/ui/input.vue'
import Select from '../components/ui/select.vue'
import Separator from '../components/ui/separator.vue'
import Progress from '../components/ui/progress.vue'
import { matchesAPI, teamsAPI, poolsAPI } from '@/services/api'
import { useToast } from '@/composables/useToast'

const { toast } = useToast()

const loading = ref(false)
const rankings = ref([])
const pools = ref([])
const searchQuery = ref('')
const filterPool = ref('ALL')

// Charger les données
const loadRankings = async () => {
  try {
    loading.value = true

    const [matchesResponse, teamsResponse, poolsResponse] = await Promise.all([
      matchesAPI.getAll(),
      teamsAPI.getAll(),
      poolsAPI.getAll()
    ])

    const matchesData = matchesResponse.data.data || matchesResponse.data
    const teamsData = teamsResponse.data.data || teamsResponse.data
    pools.value = poolsResponse.data.data || poolsResponse.data

    // Calculer les statistiques pour chaque équipe
    const stats = {}

    teamsData.forEach(team => {
      stats[team.id] = {
        id: team.id,
        company: team.company,
        pool: team.pool?.name || 'Non assigné',
        poolId: team.pool?.id || null,
        players: [
          team.player1 ? `${team.player1.firstName} ${team.player1.lastName}` : '',
          team.player2 ? `${team.player2.firstName} ${team.player2.lastName}` : ''
        ].filter(Boolean),
        points: 0,
        played: 0,
        won: 0,
        lost: 0,
        setsWon: 0,
        setsLost: 0,
        gamesWon: 0,
        gamesLost: 0
      }
    })

    // Analyser les matchs terminés
    matchesData.filter(m => m.status === 'TERMINE').forEach(match => {
      const team1Id = match.team1?.id
      const team2Id = match.team2?.id

      if (team1Id && stats[team1Id]) {
        stats[team1Id].played++
        const result = analyzeScore(match.score_team1, match.score_team2)
        stats[team1Id].setsWon += result.setsWon
        stats[team1Id].setsLost += result.setsLost
        stats[team1Id].gamesWon += result.gamesWon
        stats[team1Id].gamesLost += result.gamesLost

        if (result.setsWon > result.setsLost) {
          stats[team1Id].won++
          stats[team1Id].points += 3
        } else {
          stats[team1Id].lost++
        }
      }

      if (team2Id && stats[team2Id]) {
        stats[team2Id].played++
        const result = analyzeScore(match.score_team2, match.score_team1)
        stats[team2Id].setsWon += result.setsWon
        stats[team2Id].setsLost += result.setsLost
        stats[team2Id].gamesWon += result.gamesWon
        stats[team2Id].gamesLost += result.gamesLost

        if (result.setsWon > result.setsLost) {
          stats[team2Id].won++
          stats[team2Id].points += 3
        } else {
          stats[team2Id].lost++
        }
      }
    })

    // Trier par points, puis différence de sets, puis différence de jeux
    rankings.value = Object.values(stats)
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points
        const diffSetsA = a.setsWon - a.setsLost
        const diffSetsB = b.setsWon - b.setsLost
        if (diffSetsB !== diffSetsA) return diffSetsB - diffSetsA
        const diffGamesA = a.gamesWon - a.gamesLost
        const diffGamesB = b.gamesWon - b.gamesLost
        return diffGamesB - diffGamesA
      })
      .map((team, index) => ({
        ...team,
        position: index + 1,
        winRate: team.played > 0 ? Math.round((team.won / team.played) * 100) : 0,
        setDiff: team.setsWon - team.setsLost,
        gameDiff: team.gamesWon - team.gamesLost
      }))

  } catch (error) {
    console.error('Erreur lors du chargement du classement:', error)
    toast.error('Erreur', 'Impossible de charger le classement')
  } finally {
    loading.value = false
  }
}

// Analyser un score
const analyzeScore = (scoreTeam, scoreOpponent) => {
  const result = { setsWon: 0, setsLost: 0, gamesWon: 0, gamesLost: 0 }

  if (!scoreTeam || !scoreOpponent) return result

  const setsTeam = scoreTeam.split(',').map(s => s.trim())
  const setsOpponent = scoreOpponent.split(',').map(s => s.trim())

  setsTeam.forEach((set, i) => {
    const [games1] = set.split('-').map(Number)
    const [games2] = (setsOpponent[i] || '0').split('-').map(Number)

    result.gamesWon += games1 || 0
    result.gamesLost += games2 || 0

    if (games1 > games2) {
      result.setsWon++
    } else {
      result.setsLost++
    }
  })

  return result
}

// Filtres
const poolOptions = computed(() => [
  { value: 'ALL', label: 'Toutes les poules' },
  ...pools.value.map(p => ({ value: p.id, label: p.name }))
])

const filteredRankings = computed(() => {
  let filtered = rankings.value

  if (filterPool.value !== 'ALL') {
    filtered = filtered.filter(t => t.poolId === filterPool.value)
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(t =>
      t.company.toLowerCase().includes(query) ||
      t.players.some(p => p.toLowerCase().includes(query))
    )
  }

  // Recalculer les positions après filtrage
  return filtered.map((team, index) => ({
    ...team,
    displayPosition: index + 1
  }))
})

// Stats globales
const globalStats = computed(() => {
  const total = rankings.value.length
  const withMatches = rankings.value.filter(t => t.played > 0).length
  const totalMatches = rankings.value.reduce((sum, t) => sum + t.played, 0) / 2
  const totalPoints = rankings.value.reduce((sum, t) => sum + t.points, 0)

  return { total, withMatches, totalMatches: Math.floor(totalMatches), totalPoints }
})

const getMedalStyle = (position) => {
  switch (position) {
    case 1:
      return { bg: 'bg-yellow-500/20', text: 'text-yellow-600 dark:text-yellow-400', icon: Trophy }
    case 2:
      return { bg: 'bg-gray-300/30', text: 'text-gray-600 dark:text-gray-400', icon: Medal }
    case 3:
      return { bg: 'bg-amber-500/20', text: 'text-amber-600 dark:text-amber-400', icon: Award }
    default:
      return null
  }
}

const formatDiff = (diff) => {
  return diff > 0 ? `+${diff}` : `${diff}`
}

onMounted(loadRankings)
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-3xl font-bold tracking-tight">Classement Général</h1>
      <p class="text-muted-foreground mt-1">Suivez le classement de toutes les équipes</p>
    </div>

    <!-- Stats globales -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card class="p-4">
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-lg bg-primary/10">
            <Users class="h-5 w-5 text-primary" />
          </div>
          <div>
            <p class="text-2xl font-bold">{{ globalStats.total }}</p>
            <p class="text-xs text-muted-foreground">Équipes inscrites</p>
          </div>
        </div>
      </Card>
      <Card class="p-4">
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-lg bg-green-500/10">
            <Trophy class="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p class="text-2xl font-bold">{{ globalStats.totalMatches }}</p>
            <p class="text-xs text-muted-foreground">Matchs joués</p>
          </div>
        </div>
      </Card>
      <Card class="p-4">
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-lg bg-blue-500/10">
            <TrendingUp class="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p class="text-2xl font-bold">{{ globalStats.totalPoints }}</p>
            <p class="text-xs text-muted-foreground">Points distribués</p>
          </div>
        </div>
      </Card>
      <Card class="p-4">
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-lg bg-purple-500/10">
            <Building2 class="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p class="text-2xl font-bold">{{ pools.length }}</p>
            <p class="text-xs text-muted-foreground">Poules actives</p>
          </div>
        </div>
      </Card>
    </div>

    <!-- Podium (top 3) -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4" v-if="rankings.length >= 3">
      <!-- 2ème place -->
      <Card class="p-6 order-2 md:order-1 bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 border-gray-300 dark:border-gray-700">
        <div class="text-center space-y-3">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-300/50 dark:bg-gray-700/50">
            <Medal class="h-8 w-8 text-gray-600 dark:text-gray-400" />
          </div>
          <div>
            <Badge variant="secondary" class="mb-2">2ème</Badge>
            <h3 class="font-bold text-lg">{{ rankings[1]?.company }}</h3>
            <p class="text-sm text-muted-foreground">{{ rankings[1]?.players.join(' & ') }}</p>
          </div>
          <div class="text-3xl font-bold">{{ rankings[1]?.points }} pts</div>
          <p class="text-sm text-muted-foreground">{{ rankings[1]?.won }}V - {{ rankings[1]?.lost }}D</p>
        </div>
      </Card>

      <!-- 1ère place -->
      <Card class="p-6 order-1 md:order-2 bg-gradient-to-br from-yellow-100 to-yellow-50 dark:from-yellow-900/30 dark:to-yellow-800/20 border-yellow-300 dark:border-yellow-700 md:-mt-4">
        <div class="text-center space-y-3">
          <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-yellow-400/30 dark:bg-yellow-500/30">
            <Trophy class="h-10 w-10 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <Badge class="mb-2 bg-yellow-500 hover:bg-yellow-600">1er</Badge>
            <h3 class="font-bold text-xl">{{ rankings[0]?.company }}</h3>
            <p class="text-sm text-muted-foreground">{{ rankings[0]?.players.join(' & ') }}</p>
          </div>
          <div class="text-4xl font-bold text-yellow-600 dark:text-yellow-400">{{ rankings[0]?.points }} pts</div>
          <p class="text-sm text-muted-foreground">{{ rankings[0]?.won }}V - {{ rankings[0]?.lost }}D</p>
        </div>
      </Card>

      <!-- 3ème place -->
      <Card class="p-6 order-3 bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-amber-800/20 border-amber-300 dark:border-amber-700">
        <div class="text-center space-y-3">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-400/30 dark:bg-amber-500/30">
            <Award class="h-8 w-8 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <Badge variant="outline" class="mb-2 border-amber-500 text-amber-600 dark:text-amber-400">3ème</Badge>
            <h3 class="font-bold text-lg">{{ rankings[2]?.company }}</h3>
            <p class="text-sm text-muted-foreground">{{ rankings[2]?.players.join(' & ') }}</p>
          </div>
          <div class="text-3xl font-bold text-amber-600 dark:text-amber-400">{{ rankings[2]?.points }} pts</div>
          <p class="text-sm text-muted-foreground">{{ rankings[2]?.won }}V - {{ rankings[2]?.lost }}D</p>
        </div>
      </Card>
    </div>

    <!-- Filtres -->
    <Card class="p-4">
      <div class="flex flex-col md:flex-row gap-4">
        <div class="flex-1 relative">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            v-model="searchQuery"
            placeholder="Rechercher une équipe ou un joueur..."
            class="pl-10"
          />
        </div>
        <div class="w-full md:w-64">
          <Select v-model="filterPool" :options="poolOptions" placeholder="Filtrer par poule" />
        </div>
      </div>
    </Card>

    <!-- Tableau classement complet -->
    <Card class="overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-muted/50">
            <tr>
              <th class="text-left py-4 px-4 font-semibold">#</th>
              <th class="text-left py-4 px-4 font-semibold">Équipe</th>
              <th class="text-left py-4 px-4 font-semibold hidden md:table-cell">Joueurs</th>
              <th class="text-center py-4 px-4 font-semibold">Pts</th>
              <th class="text-center py-4 px-4 font-semibold">J</th>
              <th class="text-center py-4 px-4 font-semibold">V</th>
              <th class="text-center py-4 px-4 font-semibold">D</th>
              <th class="text-center py-4 px-4 font-semibold hidden lg:table-cell">Sets</th>
              <th class="text-center py-4 px-4 font-semibold hidden lg:table-cell">Jeux</th>
              <th class="text-center py-4 px-4 font-semibold">%</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="team in filteredRankings"
              :key="team.id"
              class="border-b hover:bg-muted/30 transition-colors"
            >
              <td class="py-4 px-4">
                <div class="flex items-center gap-2">
                  <div
                    v-if="getMedalStyle(team.position)"
                    class="p-2 rounded-full"
                    :class="getMedalStyle(team.position).bg"
                  >
                    <component
                      :is="getMedalStyle(team.position).icon"
                      class="h-4 w-4"
                      :class="getMedalStyle(team.position).text"
                    />
                  </div>
                  <span v-else class="w-8 text-center font-bold text-lg">{{ team.displayPosition }}</span>
                </div>
              </td>
              <td class="py-4 px-4">
                <div class="space-y-1">
                  <div class="flex items-center gap-2">
                    <Building2 class="h-4 w-4 text-primary" />
                    <span class="font-semibold">{{ team.company }}</span>
                  </div>
                  <Badge variant="outline" class="text-xs">{{ team.pool }}</Badge>
                </div>
              </td>
              <td class="py-4 px-4 hidden md:table-cell">
                <p class="text-sm text-muted-foreground">{{ team.players.join(', ') }}</p>
              </td>
              <td class="py-4 px-4 text-center">
                <span class="text-xl font-bold">{{ team.points }}</span>
              </td>
              <td class="py-4 px-4 text-center text-muted-foreground">{{ team.played }}</td>
              <td class="py-4 px-4 text-center">
                <Badge variant="outline" class="bg-green-500/10 text-green-700 dark:text-green-400">
                  {{ team.won }}
                </Badge>
              </td>
              <td class="py-4 px-4 text-center">
                <Badge variant="outline" class="bg-red-500/10 text-red-700 dark:text-red-400">
                  {{ team.lost }}
                </Badge>
              </td>
              <td class="py-4 px-4 text-center hidden lg:table-cell">
                <span :class="team.setDiff >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'" class="font-medium">
                  {{ formatDiff(team.setDiff) }}
                </span>
              </td>
              <td class="py-4 px-4 text-center hidden lg:table-cell">
                <span :class="team.gameDiff >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'" class="font-medium">
                  {{ formatDiff(team.gameDiff) }}
                </span>
              </td>
              <td class="py-4 px-4 text-center">
                <div class="flex flex-col items-center gap-1">
                  <span class="text-sm font-medium">{{ team.winRate }}%</span>
                  <Progress :model-value="team.winRate" class="h-1.5 w-12" />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty state -->
      <div v-if="filteredRankings.length === 0" class="p-12 text-center">
        <Trophy class="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 class="text-lg font-semibold mb-2">Aucune équipe trouvée</h3>
        <p class="text-muted-foreground">Modifiez vos critères de recherche</p>
      </div>
    </Card>
  </div>
</template>
