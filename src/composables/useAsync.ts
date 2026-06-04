import { ref } from 'vue'
import axios from 'axios'

interface UseAsyncOptions {
  toast?: { show: (msg: string, type?: 'success' | 'error' | 'warning' | 'info') => void } | null
  successMessage?: string
  errorMessage?: string
}

export function useAsync() {
  const loading = ref(false)

  const run = async <T>(
    asyncFn: () => Promise<T>,
    options?: UseAsyncOptions,
  ): Promise<T | null> => {
    loading.value = true
    try {
      const result = await asyncFn()
      if (options?.successMessage && options.toast) {
        options.toast.show(options.successMessage, 'success')
      }
      return result
    } catch (error: unknown) {
      let msg = options?.errorMessage || 'Произошла ошибка'
      if (axios.isAxiosError(error) && error.response?.data) {
        const d = error.response.data as { message?: string; msg?: string; details?: string }
        msg = d.message || d.msg || d.details || msg
      }
      if (options?.toast) {
        options.toast.show(msg, 'error')
      } else {
        console.error(msg, error)
      }
      return null
    } finally {
      loading.value = false
    }
  }

  return { loading, run }
}
