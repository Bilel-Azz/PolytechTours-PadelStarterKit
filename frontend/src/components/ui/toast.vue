<script setup>
import { ref } from 'vue'
import { X } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

const props = defineProps({
  variant: {
    type: String,
    default: 'default'
  },
  title: String,
  description: String,
  visible: Boolean
})

const emit = defineEmits(['close'])
</script>

<template>
  <div
    v-if="visible"
    :class="cn(
      'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all',
      {
        'border bg-background text-foreground': variant === 'default',
        'destructive group border-destructive bg-destructive text-destructive-foreground': variant === 'destructive'
      },
      $attrs.class
    )"
  >
    <div class="grid gap-1">
      <div v-if="title" class="text-sm font-semibold">{{ title }}</div>
      <div v-if="description" class="text-sm opacity-90">{{ description }}</div>
      <slot />
    </div>
    <button
      @click="emit('close')"
      class="absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100"
    >
      <X class="h-4 w-4" />
    </button>
  </div>
</template>

<script>
export default {
  inheritAttrs: false
}
</script>
