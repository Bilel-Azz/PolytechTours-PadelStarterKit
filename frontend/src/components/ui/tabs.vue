<script setup>
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from 'radix-vue'
import { cn } from '@/lib/utils'

defineProps({
  defaultValue: String,
  modelValue: String
})

defineEmits(['update:modelValue'])
