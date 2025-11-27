<script setup>
import { computed } from 'vue'
import { cn } from '@/lib/utils'
import { ChevronDown } from 'lucide-vue-next'

const props = defineProps({
  modelValue: [String, Number],
  options: Array,
  placeholder: String,
  disabled: Boolean
})

const emit = defineEmits(['update:modelValue'])

const selectedOption = computed(() => {
  return props.options?.find(opt => opt.value === props.modelValue)
})
</script>

<template>
  <div class="relative">
    <select
      :value="modelValue"
      @change="emit('update:modelValue', $event.target.value)"
      :disabled="disabled"
      :class="cn(
        'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        $attrs.class
      )"
    >
      <option value="" disabled hidden>{{ placeholder }}</option>
      <option v-for="option in options" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>
    <ChevronDown class="absolute right-3 top-3 h-4 w-4 opacity-50 pointer-events-none" />
  </div>
</template>

<script>
export default {
  inheritAttrs: false
}
</script>
