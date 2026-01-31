<script setup>
import { ref, onMounted } from 'vue'
import { Plus, Edit, Trash, Search, Building2, Users, ChevronDown, ChevronUp } from 'lucide-vue-next'
import Card from '@/components/ui/card.vue'
import Button from '@/components/ui/button.vue'
import Input from '@/components/ui/input.vue'
import Label from '@/components/ui/label.vue'
import Dialog from '@/components/ui/dialog.vue'
import DialogTrigger from '@/components/ui/dialog/DialogTrigger.vue'
import DialogContent from '@/components/ui/dialog/DialogContent.vue'
import DialogHeader from '@/components/ui/dialog/DialogHeader.vue'
import DialogTitle from '@/components/ui/dialog/DialogTitle.vue'
import DialogDescription from '@/components/ui/dialog/DialogDescription.vue'
import DialogFooter from '@/components/ui/dialog/DialogFooter.vue'
import Badge from '@/components/ui/badge.vue'
import { companiesAPI, playersAPI } from '@/services/api'
import { useToast } from '@/composables/useToast'

const { toast } = useToast()

const companies = ref([])
const players = ref([])
const loading = ref(false)
const showDialog = ref(false)
const showPlayersDialog = ref(false)
const editingCompany = ref(null)
const selectedCompany = ref(null)
const searchQuery = ref('')
const expandedCompanies = ref({})

const formData = ref({
  name: '',
  description: '',
  contactEmail: '',
  contactPhone: ''
})

// Charger les entreprises
const loadCompanies = async () => {
  try {
    loading.value = true
    const params = searchQuery.value ? { search: searchQuery.value } : {}
    const response = await companiesAPI.getAll(params)
    companies.value = response.data.data || response.data
  } catch (error) {
    console.error('Erreur lors du chargement des entreprises:', error)
    toast.error('Erreur', 'Impossible de charger les entreprises')
  } finally {
    loading.value = false
  }
}

// Charger tous les joueurs
const loadPlayers = async () => {
  try {
    const response = await playersAPI.getAll({ limit: 1000 })
    players.value = response.data.data || response.data
  } catch (error) {
    console.error('Erreur lors du chargement des joueurs:', error)
  }
}

// Ouvrir le dialog pour creer/editer
const openDialog = (company = null) => {
  if (company) {
    editingCompany.value = company
    formData.value = {
      name: company.name,
      description: company.description || '',
      contactEmail: company.contactEmail || '',
      contactPhone: company.contactPhone || ''
    }
  } else {
    editingCompany.value = null
    formData.value = {
      name: '',
      description: '',
      contactEmail: '',
      contactPhone: ''
    }
  }
  showDialog.value = true
}

// Sauvegarder une entreprise
const saveCompany = async () => {
  if (!formData.value.name) {
    toast.error('Erreur', 'Le nom de l\'entreprise est requis')
    return
  }

  try {
    loading.value = true

    const companyData = {
      name: formData.value.name,
      description: formData.value.description || undefined,
      contactEmail: formData.value.contactEmail || undefined,
      contactPhone: formData.value.contactPhone || undefined
    }

    if (editingCompany.value) {
      await companiesAPI.update(editingCompany.value.id, companyData)
      toast.success('Succes', 'Entreprise modifiee avec succes')
    } else {
      await companiesAPI.create(companyData)
      toast.success('Succes', 'Entreprise creee avec succes')
    }

    showDialog.value = false
    await loadCompanies()
  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error)
    const errorMessage = error.response?.data?.error?.message || error.response?.data?.message || 'Impossible de sauvegarder l\'entreprise'
    toast.error('Erreur', errorMessage)
  } finally {
    loading.value = false
  }
}

// Supprimer une entreprise
const deleteCompany = async (company) => {
  if (!confirm(`Etes-vous sur de vouloir supprimer ${company.name} ?`)) {
    return
  }

  try {
    loading.value = true
    await companiesAPI.delete(company.id)
    toast.success('Succes', 'Entreprise supprimee avec succes')
    await loadCompanies()
  } catch (error) {
    console.error('Erreur lors de la suppression:', error)
    toast.error('Erreur', error.response?.data?.error?.message || 'Impossible de supprimer l\'entreprise')
  } finally {
    loading.value = false
  }
}

// Toggle pour afficher/masquer les joueurs
const toggleExpand = (companyId) => {
  expandedCompanies.value[companyId] = !expandedCompanies.value[companyId]
}

// Voir les joueurs d'une entreprise
const viewPlayers = async (company) => {
  selectedCompany.value = company
  showPlayersDialog.value = true
}

// Joueurs d'une entreprise (filtre par nom string)
const getCompanyPlayers = (companyName) => {
  return players.value.filter(p => p.company === companyName)
}

onMounted(() => {
  loadCompanies()
  loadPlayers()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Gestion des Entreprises</h1>
        <p class="text-muted-foreground mt-1">Creez et gerez les entreprises participantes</p>
      </div>

      <Dialog v-model:open="showDialog">
        <DialogTrigger>
          <Button class="gap-2" @click="openDialog()">
            <Plus class="h-4 w-4" />
            Nouvelle entreprise
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{{ editingCompany ? 'Modifier' : 'Creer' }} une entreprise</DialogTitle>
            <DialogDescription>
              Remplissez les informations de l'entreprise
            </DialogDescription>
          </DialogHeader>

          <div class="space-y-4 py-4">
            <div class="space-y-2">
              <Label for="name">Nom de l'entreprise *</Label>
              <Input id="name" v-model="formData.name" placeholder="Tech Corp" required />
            </div>

            <div class="space-y-2">
              <Label for="description">Description</Label>
              <Input id="description" v-model="formData.description" placeholder="Description de l'entreprise" />
            </div>

            <div class="space-y-2">
              <Label for="contactEmail">Email de contact</Label>
              <Input id="contactEmail" v-model="formData.contactEmail" type="email" placeholder="contact@entreprise.com" />
            </div>

            <div class="space-y-2">
              <Label for="contactPhone">Telephone de contact</Label>
              <Input id="contactPhone" v-model="formData.contactPhone" placeholder="01 23 45 67 89" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" @click="showDialog = false">Annuler</Button>
            <Button @click="saveCompany" :disabled="loading">
              {{ editingCompany ? 'Modifier' : 'Creer' }}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>

    <!-- Search -->
    <Card class="p-4">
      <div class="flex items-center gap-2">
        <Search class="h-5 w-5 text-muted-foreground" />
        <Input
          v-model="searchQuery"
          placeholder="Rechercher une entreprise..."
          class="flex-1"
          @input="loadCompanies"
        />
      </div>
    </Card>

    <!-- Companies List -->
    <Card class="p-6">
      <div class="space-y-4">
        <h3 class="text-lg font-semibold">Liste des entreprises ({{ companies.length }})</h3>

        <div v-if="loading" class="text-center py-12">
          <p class="text-muted-foreground">Chargement...</p>
        </div>

        <div v-else-if="companies.length === 0" class="text-center py-12">
          <Building2 class="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p class="text-muted-foreground">Aucune entreprise trouvee</p>
          <p class="text-sm text-muted-foreground mt-1">Creez votre premiere entreprise pour commencer</p>
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="company in companies"
            :key="company.id"
            class="border rounded-lg overflow-hidden"
          >
            <!-- Company Header -->
            <div class="p-4 bg-muted/30 flex items-center justify-between">
              <div class="flex items-center gap-4">
                <div class="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 class="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h4 class="font-semibold text-lg">{{ company.name }}</h4>
                  <p v-if="company.description" class="text-sm text-muted-foreground">{{ company.description }}</p>
                </div>
              </div>

              <div class="flex items-center gap-4">
                <div class="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users class="h-4 w-4" />
                  <span>{{ getCompanyPlayers(company.name).length }} joueurs</span>
                </div>

                <Badge v-if="company.isActive !== false" variant="default">Active</Badge>
                <Badge v-else variant="secondary">Inactive</Badge>

                <div class="flex items-center gap-1">
                  <Button variant="ghost" size="icon" @click="toggleExpand(company.id)">
                    <ChevronDown v-if="!expandedCompanies[company.id]" class="h-4 w-4" />
                    <ChevronUp v-else class="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" @click="openDialog(company)">
                    <Edit class="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" @click="deleteCompany(company)" class="text-destructive hover:text-destructive">
                    <Trash class="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <!-- Expanded Content - Players List -->
            <div v-if="expandedCompanies[company.id]" class="p-4 border-t">
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <h5 class="font-medium">Joueurs de {{ company.name }}</h5>
                </div>

                <div v-if="getCompanyPlayers(company.name).length === 0" class="text-center py-4">
                  <p class="text-sm text-muted-foreground">Aucun joueur dans cette entreprise</p>
                </div>

                <div v-else class="grid gap-2">
                  <div
                    v-for="player in getCompanyPlayers(company.name)"
                    :key="player.id"
                    class="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <span class="font-medium">{{ player.firstName }} {{ player.lastName }}</span>
                      <span class="text-sm text-muted-foreground ml-2">{{ player.licenseNumber }}</span>
                    </div>
                    <Badge v-if="player.has_account" variant="outline" class="text-xs">Compte actif</Badge>
                  </div>
                </div>

                <!-- Contact Info -->
                <div v-if="company.contactEmail || company.contactPhone" class="pt-3 border-t mt-3">
                  <p class="text-sm text-muted-foreground">
                    <span v-if="company.contactEmail">Email: {{ company.contactEmail }}</span>
                    <span v-if="company.contactEmail && company.contactPhone"> | </span>
                    <span v-if="company.contactPhone">Tel: {{ company.contactPhone }}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  </div>
</template>
