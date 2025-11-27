<script setup>
import { DropdownMenuItem } from 'radix-vue'
import { cn } from '@/lib/utils'

defineProps({
  inset: Boolean
})
</script>

<template>
  <DropdownMenuItem
    :class="cn(
      'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      inset && 'pl-8',
      $attrs.class
    )"
  >
    <slot />
  </DropdownMenuItem>
</template>

<script>
export default {
  inheritAttrs: false
}
</script>
