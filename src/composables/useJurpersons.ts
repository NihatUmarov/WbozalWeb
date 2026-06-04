import { ref, computed } from 'vue'
import { jurpersonService } from '@/api/jurpersonService'
import { authService } from '@/api/authService'
import type { JurpersonShort } from '@/api/types'
import type { Ref } from 'vue'

interface ToastInstance {
  show: (message: string, type?: 'success' | 'error' | 'info') => void
}

const jurpersons = ref<JurpersonShort[]>([])
const selectedId = ref<number | null>(Number(localStorage.getItem('selected_jurperson_id')) || null)
const isStateLoading = ref(false)

export function useJurpersons(toastRef?: Ref<ToastInstance | null>) {
  const currentJurperson = computed(() =>
    jurpersons.value.find((j) => j.idJurperson === selectedId.value),
  )

  const load = async () => {
    if (jurpersons.value.length > 0) return
    isStateLoading.value = true
    try {
      const data = await jurpersonService.getJurpersons()
      jurpersons.value = data.jurpersons
      if (data.activeId) {
        selectedId.value = data.activeId
        localStorage.setItem('selected_jurperson_id', data.activeId.toString())
      }
    } catch {
      toastRef?.value?.show('Ошибка загрузки организаций', 'error')
    } finally {
      isStateLoading.value = false
    }
  }

  const select = async (id: number): Promise<boolean> => {
    try {
      // Бьем в единый эндпоинт авторизации вместо старого selectJurperson
      const res = await authService.switchProfile(id)

      if (res?.tok && res?.rf_tok) {
        localStorage.setItem('access_token', res.tok)
        localStorage.setItem('refresh_token', res.rf_tok)
        if (res.role) localStorage.setItem('user_role', res.role)
      }

      localStorage.setItem('selected_jurperson_id', id.toString())
      selectedId.value = id
      return true
    } catch {
      toastRef?.value?.show('Ошибка при выборе организации', 'error')
      return false
    }
  }

  return { jurpersons, selectedId, isStateLoading, currentJurperson, load, select }
}
