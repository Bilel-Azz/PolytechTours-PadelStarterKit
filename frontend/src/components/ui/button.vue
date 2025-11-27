<script setup>
import { computed } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps({
  variant: {
    type: String,
    default: 'default'
  },
  size: {
    type: String,
    default: 'default'
  },
  asChild: {
    type: Boolean,
    default: false
  }
})

const buttonClass = computed(() => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'

  const variants = {
    default: 'bg-indigo-600 text-white hover:bg-indigo-700',
    destructive: 'bg-red-600 text-white hover:bg-red-700',
    outline: 'border border-gray-300 bg-white hover:bg-gray-50 text-gray-900',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
    ghost: 'hover:bg-gray-100 text-gray-900',
    link: 'text-indigo-600 underline-offset-4 hover:underline'
  }

  const sizes = {
    default: 'h-10 px-4 py-2',
    sm: 'h-9 px-3 text-xs',
    lg: 'h-11 px-8 text-base',
    icon: 'h-10 w-10'
  }

  return cn(
    baseClasses,
    variants[props.variant],
    sizes[props.size]
  )
})
</script>

<template>
  <button :class="buttonClass">
    <slot />
  </button>
</template>
