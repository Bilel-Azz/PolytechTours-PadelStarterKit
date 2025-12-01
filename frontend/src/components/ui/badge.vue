<script setup>
import { computed } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps({
  variant: {
    type: String,
    default: 'default'
  }
})

const badgeClass = computed(() => {
  const baseClasses = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors'

  const variants = {
    default: 'bg-primary/10 text-primary border-transparent',
    secondary: 'bg-secondary text-secondary-foreground border-transparent',
    destructive: 'bg-destructive/10 text-destructive border-transparent',
    success: 'bg-green-500/10 text-green-700 dark:text-green-400 border-transparent',
    warning: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-transparent',
    outline: 'border border-input bg-transparent'
  }

  return cn(baseClasses, variants[props.variant])
})
</script>

<template>
  <span :class="badgeClass">
    <slot />
  </span>
</template>
