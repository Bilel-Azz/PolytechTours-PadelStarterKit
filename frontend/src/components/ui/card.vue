<script setup>
import { cn } from '@/lib/utils'
</script>

<template>
  <div :class="cn('rounded-lg border bg-white shadow-sm', $attrs.class)">
    <slot />
  </div>
</template>

<script>
export default {
  inheritAttrs: false
}
</script>
