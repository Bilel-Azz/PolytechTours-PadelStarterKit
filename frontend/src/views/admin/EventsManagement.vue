<script setup>
import { ref, onMounted } from 'vue'
import { Plus, Edit, Trash, Calendar, Clock } from 'lucide-vue-next'
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
import { eventsAPI } from '@/services/api'
import { useToast } from '@/composables/useToast'

const { toast } = useToast()

const events = ref([])
const loading = ref(false)
const showDialog = ref(false)
const editingEvent = ref(null)

const formData = ref({
  eventDate: '',
  eventTime: '19:00'
})

const loadData = async () => {
  try {
    loading.value = true
    const response = await eventsAPI.getAll()
    events.value = response.data.data || response.data
  } catch (error) {
    console.error('Erreur:', error)
    toast.error('Erreur', 'Impossible de charger les événements')
  } finally {
    loading.value = false
  }
}

const openDialog = (event = null) => {
  if (event) {
    editingEvent.value = event
    formData.value = {
      eventDate: event.eventDate,
      eventTime: event.eventTime
    }
  } else {
    editingEvent.value = null
    const today = new Date().toISOString().split('T')[0]
    formData.value = {
      eventDate: today,
      eventTime: '19:00'
    }
  }
  showDialog.value = true
}

const saveEvent = async () => {
  if (!formData.value.eventDate || !formData.value.eventTime) {
    toast.error('Erreur', 'Veuillez remplir tous les champs')
    return
  }

  try {
    loading.value = true
    const eventData = {
      eventDate: formData.value.eventDate,
      eventTime: formData.value.eventTime
    }

    if (editingEvent.value) {
      await eventsAPI.update(editingEvent.value.id, eventData)
      toast.success('Succès', 'Événement modifié')
    } else {
      await eventsAPI.create(eventData)
      toast.success('Succès', 'Événement créé')
    }

    showDialog.value = false
    await loadData()
  } catch (error) {
    console.error('Erreur:', error)
    toast.error('Erreur', error.response?.data?.error?.message || 'Impossible de sauvegarder')
  } finally {
    loading.value = false
  }
}

const deleteEvent = async (event) => {
  if (!confirm('Êtes-vous sûr de vouloir supprimer cet événement ? Les matchs associés seront également supprimés.')) return

  try {
    loading.value = true
    await eventsAPI.delete(event.id)
    toast.success('Succès', 'Événement supprimé')
    await loadData()
  } catch (error) {
    toast.error('Erreur', error.response?.data?.error?.message || 'Impossible de supprimer')
  } finally {
    loading.value = false
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

onMounted(loadData)
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Gestion des Événements</h1>
        <p class="text-muted-foreground mt-1">Planifiez les journées de matchs</p>
      </div>

      <Dialog v-model:open="showDialog">
        <DialogTrigger>
          <Button class="gap-2" @click="openDialog()">
            <Plus class="h-4 w-4" />
            Nouvel événement
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{{ editingEvent ? 'Modifier' : 'Créer' }} un événement</DialogTitle>
            <DialogDescription>Définissez la date et l'heure de l'événement</DialogDescription>
          </DialogHeader>

          <div class="space-y-4 py-4">
            <div class="space-y-2">
              <Label>Date *</Label>
              <Input type="date" v-model="formData.eventDate" />
            </div>
            <div class="space-y-2">
              <Label>Heure *</Label>
              <Input type="time" v-model="formData.eventTime" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" @click="showDialog = false">Annuler</Button>
            <Button @click="saveEvent" :disabled="loading">
              {{ editingEvent ? 'Modifier' : 'Créer' }}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>

    <Card class="p-6">
      <h3 class="text-lg font-semibold mb-4">Liste des événements ({{ events.length }})</h3>

      <div v-if="loading" class="text-center py-12">
        <p class="text-muted-foreground">Chargement...</p>
      </div>

      <div v-else-if="events.length === 0" class="text-center py-12">
        <Calendar class="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
        <p class="text-muted-foreground">Aucun événement planifié</p>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card v-for="event in events" :key="event.id" class="p-4 hover:shadow-lg transition-all">
          <div class="flex items-start justify-between">
            <div class="space-y-2">
              <div class="flex items-center gap-2">
                <Calendar class="h-4 w-4 text-primary" />
                <span class="font-medium">{{ formatDate(event.eventDate) }}</span>
              </div>
              <div class="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock class="h-4 w-4" />
                <span>{{ event.eventTime }}</span>
              </div>
              <Badge v-if="event.matches?.length" variant="outline">
                {{ event.matches.length }} match(s)
              </Badge>
            </div>
            <div class="flex gap-1">
              <Button variant="ghost" size="icon" @click="openDialog(event)">
                <Edit class="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" class="text-destructive" @click="deleteEvent(event)">
                <Trash class="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </Card>
  </div>
</template>
