<script setup>
import { DialogTitle } from 'radix-vue'
import { cn } from '@/lib/utils'
</script>

<template>
  <DialogTitle :class="cn('text-lg font-semibold leading-none tracking-tight', $attrs.class)">
    <slot />
  </DialogTitle>
</template>

<script>
export default {
  inheritAttrs: false
}
</script>
