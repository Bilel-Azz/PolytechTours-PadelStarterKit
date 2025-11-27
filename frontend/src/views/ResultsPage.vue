<script setup>
import { ref } from 'vue'
import { Trophy, TrendingUp, Medal, Award, Target, Zap, Flame, Star, Crown, ChevronUp, ChevronDown } from 'lucide-vue-next'
import Card from '../components/ui/card.vue'
import Badge from '../components/ui/badge.vue'
import Separator from '../components/ui/separator.vue'
import Progress from '../components/ui/progress.vue'

// Mock data - À remplacer par l'API
const rankings = ref([
  {
    position: 1,
    company: 'Tech Corp',
    points: 12,
    played: 4,
    won: 4,
    lost: 0,
    setDiff: '+8',
    winRate: 100,
    trend: 'up'
  },
  {
    position: 2,
    company: 'Innov Ltd',
    points: 9,
    played: 4,
    won: 3,
    lost: 1,
    setDiff: '+4',
    winRate: 75,
    trend: 'up'
  },
  {
    position: 3,
    company: 'DevHub',
    points: 6,
    played: 4,
    won: 2,
    lost: 2,
    setDiff: '+1',
    winRate: 50,
    trend: 'down'
  },
  {
    position: 4,
    company: 'StartCo',
    points: 3,
    played: 4,
    won: 1,
    lost: 3,
    setDiff: '-3',
    winRate: 25,
    trend: 'stable'
  },
  {
    position: 5,
    company: 'CodeFactory',
    points: 0,
    played: 4,
    won: 0,
    lost: 4,
    setDiff: '-10',
    winRate: 0,
    trend: 'down'
  }
])

const myStats = ref({
  company: 'Tech Corp',
  position: 1,
  points: 12,
  played: 4,
  won: 4,
  lost: 0,
  winRate: 100,
  streak: 4,
  lastMatches: [
    { result: 'W', opponent: 'Innov Ltd', score: '6-4, 6-3', date: '22/11' },
    { result: 'W', opponent: 'DevHub', score: '6-2, 7-5', date: '15/11' },
    { result: 'W', opponent: 'StartCo', score: '6-4, 3-6, 6-4', date: '08/11' },
    { result: 'W', opponent: 'CodeFactory', score: '6-0, 6-1', date: '01/11' }
  ],
  achievements: [
    { name: 'Série de victoires', value: '4 matchs', icon: Flame },
    { name: 'Meilleur score', value: '6-0, 6-1', icon: Star },
    { name: 'Leader', value: '1ère place', icon: Crown }
  ]
})

const getMedalComponent = (position) => {
  switch (position) {
    case 1:
      return { icon: Trophy, class: 'text-yellow-500 bg-yellow-50' }
    case 2:
      return { icon: Medal, class: 'text-gray-400 bg-gray-100' }
    case 3:
      return { icon: Award, class: 'text-amber-600 bg-amber-50' }
    default:
      return null
  }
}

const getTrendIcon = (trend) => {
  switch (trend) {
    case 'up':
      return { icon: ChevronUp, class: 'text-green-600' }
    case 'down':
      return { icon: ChevronDown, class: 'text-red-600' }
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
          <div class="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full -mr-16 -mt-16 group-hover:bg-green-500/10 transition-colors"></div>
          <div class="relative space-y-2">
            <div class="flex items-center justify-between">
              <TrendingUp class="h-8 w-8 text-green-600" />
              <Badge>Taux victoire</Badge>
            </div>
            <p class="text-3xl font-bold text-green-600">{{ myStats.winRate }}%</p>
            <Progress :model-value="myStats.winRate" class="h-2" />
          </div>
        </Card>

        <Card class="p-6 relative overflow-hidden group hover:shadow-lg transition-all">
          <div class="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 group-hover:bg-blue-500/10 transition-colors"></div>
          <div class="relative space-y-2">
            <div class="flex items-center justify-between">
              <Zap class="h-8 w-8 text-blue-600" />
              <Badge variant="outline">Points</Badge>
            </div>
            <p class="text-3xl font-bold text-blue-600">{{ myStats.points }}</p>
            <p class="text-sm text-muted-foreground">{{ myStats.won }}V - {{ myStats.lost }}D</p>
          </div>
        </Card>

        <Card class="p-6 relative overflow-hidden group hover:shadow-lg transition-all">
          <div class="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full -mr-16 -mt-16 group-hover:bg-orange-500/10 transition-colors"></div>
          <div class="relative space-y-2">
            <div class="flex items-center justify-between">
              <Flame class="h-8 w-8 text-orange-600" />
              <Badge variant="destructive">Série</Badge>
            </div>
            <p class="text-3xl font-bold text-orange-600">{{ myStats.streak }}</p>
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
                  <Badge variant="outline" class="bg-green-50 text-green-700 border-green-200">{{ team.won }}</Badge>
                </td>
                <td class="py-4 px-4 text-center">
                  <Badge variant="outline" class="bg-red-50 text-red-700 border-red-200">{{ team.lost }}</Badge>
                </td>
                <td class="py-4 px-4 text-center">
                  <span :class="team.setDiff.startsWith('+') ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'">
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
