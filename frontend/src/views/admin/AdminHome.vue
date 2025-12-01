<script setup>
import { ref, onMounted } from 'vue'
import { Users, UserCheck, Shield, Calendar, Trophy, TrendingUp } from 'lucide-vue-next'
import Card from '@/components/ui/card.vue'
import Button from '@/components/ui/button.vue'
import { playersAPI, teamsAPI, poolsAPI, eventsAPI, matchesAPI } from '@/services/api'
import { useRouter } from 'vue-router'

const router = useRouter()

const stats = ref({
  players: 0,
  teams: 0,
  pools: 0,
  events: 0,
  matches: 0,
  upcomingMatches: 0
})

const loading = ref(false)

// Charger les statistiques
const loadStats = async () => {
  try {
    loading.value = true
    const [playersRes, teamsRes, poolsRes, eventsRes, matchesRes] = await Promise.all([
      playersAPI.getAll(),
      teamsAPI.getAll(),
      poolsAPI.getAll(),
      eventsAPI.getAll(),
      matchesAPI.getAll()
    ])

    const playersData = playersRes.data.data || playersRes.data
    const teamsData = teamsRes.data.data || teamsRes.data
    const poolsData = poolsRes.data.data || poolsRes.data
    const eventsData = eventsRes.data.data || eventsRes.data
    const matchesData = matchesRes.data.data || matchesRes.data

    stats.value = {
      players: playersData.length,
      teams: teamsData.length,
      pools: poolsData.length,
      events: eventsData.length,
      matches: matchesData.length,
      upcomingMatches: matchesData.filter(m => m.status === 'A_VENIR').length
    }
  } catch (error) {
    console.error('Erreur lors du chargement des statistiques:', error)
  } finally {
    loading.value = false
  }
}

const quickActions = [
  {
    title: 'Créer un joueur',
    description: 'Ajoutez un nouveau joueur',
    icon: Users,
    color: 'bg-blue-500',
    action: () => router.push('/admin/players')
  },
  {
    title: 'Créer une équipe',
    description: 'Formez une nouvelle équipe',
    icon: UserCheck,
    color: 'bg-green-500',
    action: () => router.push('/admin/teams')
  },
  {
    title: 'Créer une poule',
    description: 'Organisez les compétitions',
    icon: Shield,
    color: 'bg-purple-500',
    action: () => router.push('/admin/pools')
  },
  {
    title: 'Créer un événement',
    description: 'Planifiez un nouveau match',
    icon: Calendar,
    color: 'bg-orange-500',
    action: () => router.push('/planning')
  }
]

onMounted(() => {
  loadStats()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-3xl font-bold tracking-tight">Dashboard Admin</h1>
      <p class="text-muted-foreground mt-1">Vue d'ensemble de votre système de gestion</p>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <!-- Players -->
      <Card class="p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-muted-foreground">Joueurs</p>
            <p class="text-3xl font-bold mt-2">{{ stats.players }}</p>
          </div>
          <div class="p-3 bg-blue-500/10 rounded-lg">
            <Users class="h-6 w-6 text-blue-500" />
          </div>
        </div>
      </Card>

      <!-- Teams -->
      <Card class="p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-muted-foreground">Équipes</p>
            <p class="text-3xl font-bold mt-2">{{ stats.teams }}</p>
          </div>
          <div class="p-3 bg-green-500/10 rounded-lg">
            <UserCheck class="h-6 w-6 text-green-500" />
          </div>
        </div>
      </Card>

      <!-- Pools -->
      <Card class="p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-muted-foreground">Poules</p>
            <p class="text-3xl font-bold mt-2">{{ stats.pools }}</p>
          </div>
          <div class="p-3 bg-purple-500/10 rounded-lg">
            <Shield class="h-6 w-6 text-purple-500" />
          </div>
        </div>
      </Card>

      <!-- Events -->
      <Card class="p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-muted-foreground">Événements</p>
            <p class="text-3xl font-bold mt-2">{{ stats.events }}</p>
          </div>
          <div class="p-3 bg-orange-500/10 rounded-lg">
            <Calendar class="h-6 w-6 text-orange-500" />
          </div>
        </div>
      </Card>

      <!-- Matches -->
      <Card class="p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-muted-foreground">Matchs</p>
            <p class="text-3xl font-bold mt-2">{{ stats.matches }}</p>
          </div>
          <div class="p-3 bg-red-500/10 rounded-lg">
            <Trophy class="h-6 w-6 text-red-500" />
          </div>
        </div>
      </Card>

      <!-- Upcoming Matches -->
      <Card class="p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-muted-foreground">À venir</p>
            <p class="text-3xl font-bold mt-2">{{ stats.upcomingMatches }}</p>
          </div>
          <div class="p-3 bg-cyan-500/10 rounded-lg">
            <TrendingUp class="h-6 w-6 text-cyan-500" />
          </div>
        </div>
      </Card>
    </div>

    <!-- Quick Actions -->
    <Card class="p-6">
      <h3 class="text-lg font-semibold mb-4">Actions rapides</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          v-for="action in quickActions"
          :key="action.title"
          @click="action.action"
          class="p-4 rounded-lg border hover:border-primary hover:shadow-lg transition-all text-left group"
        >
          <div class="flex items-start gap-3">
            <div :class="['p-2 rounded-lg', action.color, 'text-white']">
              <component :is="action.icon" class="h-5 w-5" />
            </div>
            <div>
              <p class="font-medium group-hover:text-primary transition-colors">{{ action.title }}</p>
              <p class="text-sm text-muted-foreground mt-1">{{ action.description }}</p>
            </div>
          </div>
        </button>
      </div>
    </Card>

    <!-- Getting Started -->
    <Card class="p-6 bg-primary/5">
      <div class="flex items-start gap-4">
        <div class="p-3 bg-primary/10 rounded-lg">
          <TrendingUp class="h-6 w-6 text-primary" />
        </div>
        <div class="flex-1">
          <h3 class="text-lg font-semibold mb-2">Commencer</h3>
          <p class="text-muted-foreground mb-4">
            Pour créer des événements et des matchs, vous devez d'abord :
          </p>
          <ol class="list-decimal list-inside space-y-2 text-sm">
            <li>Créer des <strong>joueurs</strong> dans le système</li>
            <li>Former des <strong>équipes</strong> avec ces joueurs (2 joueurs par équipe)</li>
            <li>Optionnellement, créer des <strong>poules</strong> pour organiser les compétitions</li>
            <li>Ensuite, créer des <strong>événements</strong> en sélectionnant les équipes</li>
          </ol>
        </div>
      </div>
    </Card>
  </div>
</template>
