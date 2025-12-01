import { ref } from 'vue'

const toasts = ref([])
let toastId = 0

export function useToast() {
  const addToast = ({ title, description, variant = 'default', duration = 3000 }) => {
    const id = toastId++
    const toast = { id, title, description, variant }

    toasts.value.push(toast)

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }

    return id
  }

  const removeToast = (id) => {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }

  const toast = (options) => addToast(options)
  toast.success = (title, description) => addToast({ title, description, variant: 'default' })
  toast.error = (title, description) => addToast({ title, description, variant: 'destructive' })

  return {
    toasts,
    addToast,
    removeToast,
    toast
  }
}
