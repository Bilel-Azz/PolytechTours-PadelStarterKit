<script setup>
import { RouterView } from 'vue-router'
import Toaster from './components/ui/toaster.vue'
</script>

<template>
  <div class="min-h-screen bg-background">
    <RouterView />
    <Toaster />
  </div>
</template>
