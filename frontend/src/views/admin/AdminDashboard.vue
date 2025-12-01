<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Home, Users, UserCheck, Shield, Calendar, ArrowLeft, ChevronLeft, Menu, X, LogOut } from 'lucide-vue-next'
import Button from '@/components/ui/button.vue'
import ThemeToggle from '@/components/ThemeToggle.vue'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const isSidebarOpen = ref(true)

const menuItems = [
  { icon: Home, label: 'Vue d\'ensemble', path: '/admin' },
  { icon: Calendar, label: 'Planning', path: '/admin/planning' },
  { icon: Users, label: 'Joueurs', path: '/admin/players' },
  { icon: UserCheck, label: 'Équipes', path: '/admin/teams' },
  { icon: Shield, label: 'Poules', path: '/admin/pools' },
]

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
}

const navigateTo = (path) => {
  router.push(path)
}

const isActive = (path) => {
  return route.path === path
}

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="relative flex min-h-screen">
    <!-- Sidebar -->
    <aside
      :class="[
        'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-background transition-transform duration-200',
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      ]"
    >
      <!-- Sidebar Header -->
      <div class="flex h-16 items-center gap-2 border-b px-6">
        <div class="flex items-center gap-2 flex-1">
          <span class="text-2xl">🎾</span>
          <span class="font-bold text-lg">Admin Panel</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          @click="toggleSidebar"
          class="lg:hidden"
        >
          <X class="h-5 w-5" />
        </Button>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 overflow-y-auto p-4">
        <div class="space-y-1">
          <button
            v-for="item in menuItems"
            :key="item.path"
            @click="navigateTo(item.path)"
            :class="[
              'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive(item.path)
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            ]"
          >
            <component :is="item.icon" class="h-4 w-4" />
            <span>{{ item.label }}</span>
          </button>
        </div>
      </nav>

      <!-- Sidebar Footer -->
      <div class="border-t p-4 space-y-2">
        <Button
          variant="outline"
          class="w-full justify-start gap-3"
          @click="router.push('/')"
        >
          <ArrowLeft class="h-4 w-4" />
          <span>Retour au site</span>
        </Button>
        <Button
          variant="ghost"
          class="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
          @click="handleLogout"
        >
          <LogOut class="h-4 w-4" />
          <span>Déconnexion</span>
        </Button>
      </div>
    </aside>

    <!-- Overlay pour mobile -->
    <div
      v-if="isSidebarOpen"
      @click="toggleSidebar"
      class="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
    />

    <!-- Main Content -->
    <div class="flex flex-1 flex-col lg:pl-64">
      <!-- Header -->
      <header class="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6">
        <Button
          variant="ghost"
          size="icon"
          @click="toggleSidebar"
          class="lg:hidden"
        >
          <Menu class="h-5 w-5" />
        </Button>

        <div class="flex flex-1 items-center justify-between">
          <div class="text-sm text-muted-foreground">
            <span v-if="authStore.user">
              Connecté en tant que <strong class="text-foreground">{{ authStore.user.email }}</strong>
            </span>
          </div>

          <div class="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <!-- Page Content -->
      <main class="flex-1 p-6">
        <router-view />
      </main>
    </div>
  </div>
</template>
