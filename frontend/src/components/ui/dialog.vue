<script setup>
import { DialogClose, DialogContent, DialogDescription, DialogOverlay, DialogPortal, DialogRoot, DialogTitle, DialogTrigger } from 'radix-vue'
import { X } from 'lucide-vue-next'
import { cn } from '@/lib/utils'
</script>

<template>
  <DialogRoot>
    <slot />
  </DialogRoot>
</template>

<script>
export const Dialog = {
  name: 'Dialog'
}

export const DialogTriggerComponent = DialogTrigger
export const DialogPortalComponent = DialogPortal
export const DialogCloseComponent = DialogClose
export const DialogOverlayComponent = DialogOverlay
export const DialogTitleComponent = DialogTitle
export const DialogDescriptionComponent = DialogDescription

export const DialogContentComponent = {
  name: 'DialogContent',
  components: { DialogContent, DialogClose, X },
  template: `
    <DialogPortal>
      <div class="fixed inset-0 z-50 bg-black/50" />
      <DialogContent :class="cn('fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-white p-6 shadow-lg', $attrs.class)">
        <slot />
        <DialogClose class="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100">
          <X class="h-4 w-4" />
        </DialogClose>
      </DialogContent>
    </DialogPortal>
  `
}
</script>
