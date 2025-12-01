<script setup>
import { useToast } from '@/composables/useToast'
import Toast from './toast.vue'

const { toasts, removeToast } = useToast()
</script>

<template>
  <teleport to="body">
    <div class="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:right-0 sm:top-auto sm:bottom-0 sm:flex-col md:max-w-[420px]">
      <transition-group name="toast">
        <Toast
          v-for="toast in toasts"
          :key="toast.id"
          :variant="toast.variant"
          :title="toast.title"
          :description="toast.description"
          :visible="true"
          @close="removeToast(toast.id)"
        />
      </transition-group>
    </div>
  </teleport>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
