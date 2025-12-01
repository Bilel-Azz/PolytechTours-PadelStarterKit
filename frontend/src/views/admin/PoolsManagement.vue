<script setup>
import { ref, onMounted } from 'vue'
import { Plus, Edit, Trash, Shield } from 'lucide-vue-next'
import Card from '@/components/ui/card.vue'
import Button from '@/components/ui/button.vue'
import Label from '@/components/ui/label.vue'
import Input from '@/components/ui/input.vue'
import Dialog from '@/components/ui/dialog.vue'
import DialogTrigger from '@/components/ui/dialog/DialogTrigger.vue'
import DialogContent from '@/components/ui/dialog/DialogContent.vue'
import DialogHeader from '@/components/ui/dialog/DialogHeader.vue'
import DialogTitle from '@/components/ui/dialog/DialogTitle.vue'
import DialogDescription from '@/components/ui/dialog/DialogDescription.vue'
import DialogFooter from '@/components/ui/dialog/DialogFooter.vue'
import Badge from '@/components/ui/badge.vue'
import { poolsAPI } from '@/services/api'
import { useToast } from '@/composables/useToast'

const { toast } = useToast()

const pools = ref([])
const loading = ref(false)
const showDialog = ref(false)
const editingPool = ref(null)

const formData = ref({
  name: ''
})

// Charger les pools
const loadPools = async () => {
  try {
    loading.value = true
    const response = await poolsAPI.getAll()
    pools.value = response.data.data || response.data
  } catch (error) {
    console.error('Erreur lors du chargement des pools:', error)
    toast.error('Erreur', 'Impossible de charger les poules')
  } finally {
    loading.value = false
  }
}

// Ouvrir le dialog
const openDialog = (pool = null) => {
  if (pool) {
    editingPool.value = pool
    formData.value = {
      name: pool.name
    }
  } else {
    editingPool.value = null
    formData.value = {
      name: ''
    }
  }
  showDialog.value = true
}

// Sauvegarder une poule
const savePool = async () => {
  if (!formData.value.name) {
    toast.error('Erreur', 'Veuillez entrer un nom pour la poule')
    return
  }

  try {
    loading.value = true

    if (editingPool.value) {
      await poolsAPI.update(editingPool.value.id, formData.value)
      toast.success('Succès', 'Poule modifiée avec succès')
    } else {
      await poolsAPI.create(formData.value)
      toast.success('Succès', 'Poule créée avec succès')
    }

    showDialog.value = false
    await loadPools()
  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error)
    const errorMessage = error.response?.data?.errors?.[0]?.message || error.response?.data?.message || 'Impossible de sauvegarder la poule'
    toast.error('Erreur', errorMessage)
  } finally {
    loading.value = false
  }
}

// Supprimer une poule
const deletePool = async (pool) => {
  if (!confirm(`Êtes-vous sûr de vouloir supprimer la poule "${pool.name}" ?`)) {
    return
  }

  try {
    loading.value = true
    await poolsAPI.delete(pool.id)
    toast.success('Succès', 'Poule supprimée avec succès')
    await loadPools()
  } catch (error) {
    console.error('Erreur lors de la suppression:', error)
    toast.error('Erreur', error.response?.data?.message || 'Impossible de supprimer la poule')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadPools()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Gestion des Poules</h1>
        <p class="text-muted-foreground mt-1">Créez et gérez les poules pour organiser les compétitions</p>
      </div>

      <Dialog v-model:open="showDialog">
        <DialogTrigger>
          <Button class="gap-2" @click="openDialog()">
            <Plus class="h-4 w-4" />
            Nouvelle poule
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{{ editingPool ? 'Modifier' : 'Créer' }} une poule</DialogTitle>
            <DialogDescription>
              Donnez un nom à la poule (ex: Poule A, Poule B)
            </DialogDescription>
          </DialogHeader>

          <div class="space-y-4 py-4">
            <div class="space-y-2">
              <Label for="name">Nom de la poule *</Label>
              <Input
                id="name"
                v-model="formData.name"
                placeholder="Poule A"
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" @click="showDialog = false">Annuler</Button>
            <Button @click="savePool" :disabled="loading">
              {{ editingPool ? 'Modifier' : 'Créer' }}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>

    <!-- Pools List -->
    <Card class="p-6">
      <div class="space-y-4">
        <h3 class="text-lg font-semibold">Liste des poules ({{ pools.length }})</h3>

        <div v-if="loading" class="text-center py-12">
          <p class="text-muted-foreground">Chargement...</p>
        </div>

        <div v-else-if="pools.length === 0" class="text-center py-12">
          <Shield class="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p class="text-muted-foreground text-lg mb-2">Aucune poule trouvée</p>
          <p class="text-sm text-muted-foreground">Créez votre première poule pour organiser les équipes</p>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card
            v-for="pool in pools"
            :key="pool.id"
            class="p-6 hover:shadow-lg transition-all"
          >
            <div class="space-y-4">
              <!-- Header -->
              <div class="flex items-start justify-between">
                <div class="flex items-center gap-3">
                  <div class="p-3 bg-primary/10 rounded-lg">
                    <Shield class="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 class="font-bold text-lg">{{ pool.name }}</h4>
                    <p class="text-sm text-muted-foreground">
                      {{ pool.teams_count || 0 }} équipe{{ pool.teams_count > 1 ? 's' : '' }}
                    </p>
                  </div>
                </div>
                <div class="flex gap-1">
                  <Button variant="ghost" size="icon" @click="openDialog(pool)">
                    <Edit class="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    @click="deletePool(pool)"
                    class="text-destructive hover:text-destructive"
                  >
                    <Trash class="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <!-- Teams in pool -->
              <div v-if="pool.teams && pool.teams.length > 0" class="space-y-2">
                <p class="text-sm font-medium">Équipes :</p>
                <div class="space-y-1">
                  <Badge
                    v-for="team in pool.teams"
                    :key="team.id"
                    variant="outline"
                    class="mr-2"
                  >
                    {{ team.company }}
                  </Badge>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Card>
  </div>
</template>
