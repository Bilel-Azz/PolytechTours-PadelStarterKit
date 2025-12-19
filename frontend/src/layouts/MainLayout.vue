<script setup>
import { ref } from 'vue'
import { RouterView, RouterLink, useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import {
  Trophy, BarChart3, LogOut, User, Calendar, Medal, Menu, X, Home, ChevronDown
} from 'lucide-vue-next'
import Button from '../components/ui/button.vue'
import Avatar from '../components/ui/avatar.vue'
import Badge from '../components/ui/badge.vue'
import ThemeToggle from '../components/ThemeToggle.vue'
import DropdownMenu from '../components/ui/dropdown-menu.vue'
import DropdownMenuTrigger from '../components/ui/dropdown-menu/DropdownMenuTrigger.vue'
import DropdownMenuContent from '../components/ui/dropdown-menu/DropdownMenuContent.vue'
import DropdownMenuItem from '../components/ui/dropdown-menu/DropdownMenuItem.vue'
import DropdownMenuSeparator from '../components/ui/dropdown-menu/DropdownMenuSeparator.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const mobileMenuOpen = ref(false)

const navigation = [
  { name: 'Accueil', path: '/user/dashboard', icon: Home },
  { name: 'Mes Matchs', path: '/user/matches', icon: Trophy },
  { name: 'Classement', path: '/user/rankings', icon: Medal },
  { name: 'Planning', path: '/user/calendar', icon: Calendar },
  { name: 'Résultats', path: '/user/results', icon: BarChart3 },
]

const isActive = (path) => {
  return route.path === path
}

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}

const goToProfile = () => {
  router.push('/user/profile')
}

const getInitials = (email) => {
  if (!email) return '?'
  return email.substring(0, 2).toUpperCase()
}
</script>

<template>
  <div class="min-h-screen bg-background">
    <!-- Header -->
    <header class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div class="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <!-- Logo -->
        <RouterLink to="/" class="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <span class="text-2xl">🎾</span>
          <h1 class="text-xl font-bold hidden sm:block">Corpo Padel</h1>
        </RouterLink>

        <!-- Navigation Desktop -->
        <nav class="hidden md:flex items-center gap-1">
          <RouterLink
            v-for="item in navigation"
            :key="item.path"
            :to="item.path"
            :class="[
              'inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
              isActive(item.path)
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            ]"
          >
            <component :is="item.icon" class="h-4 w-4" />
            {{ item.name }}
          </RouterLink>
        </nav>

        <!-- Actions -->
        <div class="flex items-center gap-2">
          <ThemeToggle />

          <!-- User Menu Desktop -->
          <div class="hidden md:block">
            <DropdownMenu>
              <DropdownMenuTrigger data-testid="user-menu-trigger">
                <Button variant="ghost" class="gap-2 pl-2 pr-3">
                  <Avatar class="h-8 w-8 bg-primary/10">
                    <span class="text-xs font-medium">{{ getInitials(authStore.user?.email) }}</span>
                  </Avatar>
                  <span class="text-sm font-medium max-w-[150px] truncate">
                    {{ authStore.user?.email }}
                  </span>
                  <ChevronDown class="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" class="w-56">
                <div class="px-2 py-1.5">
                  <p class="text-sm font-medium">{{ authStore.user?.email }}</p>
                  <p class="text-xs text-muted-foreground">
                    {{ authStore.user?.role === 'ADMINISTRATEUR' ? 'Administrateur' : 'Joueur' }}
                  </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem @click="goToProfile">
                  <User class="h-4 w-4 mr-2" />
                  Mon Profil
                </DropdownMenuItem>
                <DropdownMenuItem v-if="authStore.isAdmin" @click="router.push('/admin')" data-testid="admin-menu-item">
                  <BarChart3 class="h-4 w-4 mr-2" />
                  Administration
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem @click="handleLogout" class="text-destructive focus:text-destructive" data-testid="logout-menu-item">
                  <LogOut class="h-4 w-4 mr-2" />
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <!-- Mobile Menu Button -->
          <Button
            variant="ghost"
            size="icon"
            class="md:hidden"
            @click="mobileMenuOpen = !mobileMenuOpen"
          >
            <Menu v-if="!mobileMenuOpen" class="h-5 w-5" />
            <X v-else class="h-5 w-5" />
          </Button>
        </div>
      </div>

      <!-- Mobile Navigation -->
      <div
        v-if="mobileMenuOpen"
        class="md:hidden border-t bg-background"
      >
        <nav class="px-4 py-3 space-y-1">
          <RouterLink
            v-for="item in navigation"
            :key="item.path"
            :to="item.path"
            @click="mobileMenuOpen = false"
            :class="[
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
              isActive(item.path)
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            ]"
          >
            <component :is="item.icon" class="h-5 w-5" />
            {{ item.name }}
          </RouterLink>

          <div class="pt-3 border-t mt-3">
            <RouterLink
              to="/user/profile"
              @click="mobileMenuOpen = false"
              class="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <User class="h-5 w-5" />
              Mon Profil
            </RouterLink>

            <RouterLink
              v-if="authStore.isAdmin"
              to="/admin"
              @click="mobileMenuOpen = false"
              class="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <BarChart3 class="h-5 w-5" />
              Administration
            </RouterLink>

            <button
              @click="handleLogout"
              class="flex w-full items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-destructive hover:bg-destructive/10"
            >
              <LogOut class="h-5 w-5" />
              Déconnexion
            </button>
          </div>
        </nav>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <RouterView />
    </main>

    <!-- Footer -->
    <footer class="border-t mt-auto">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div class="flex items-center gap-2 text-sm text-muted-foreground">
            <span class="text-lg">🎾</span>
            <span>Corpo Padel - Saison 2025</span>
          </div>
          <div class="flex items-center gap-4 text-sm text-muted-foreground">
            <RouterLink to="/" class="hover:text-foreground transition-colors">
              Accueil
            </RouterLink>
            <span>•</span>
            <RouterLink to="/user/rankings" class="hover:text-foreground transition-colors">
              Classement
            </RouterLink>
            <span>•</span>
            <RouterLink to="/user/calendar" class="hover:text-foreground transition-colors">
              Planning
            </RouterLink>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>
