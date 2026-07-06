import { reactive, computed } from 'vue'
import { adminService, type UserPermissionsResponse } from '../api/adminService' // Исправили путь

// Локальный реактивный стейт
const state = reactive({
  permissions: {
    remains: false,
    invoice: false,
    cards: false,
    profile: false,
    admin: false,
  } as UserPermissionsResponse,
  isLoading: false,
  isLoaded: false,
})

export const usePermissions = () => {
  const fetchPermissions = async () => {
    state.isLoading = true
    try {
      const data = await adminService.getPermissions()
      state.permissions = data
      state.isLoaded = true
    } catch (error) {
      console.error('Ошибка при получении прав доступа:', error)
      resetPermissions()
    } finally {
      state.isLoading = false
    }
  }

  const resetPermissions = () => {
    state.permissions = {
      remains: false,
      invoice: false,
      cards: false,
      profile: false,
      admin: false,
    }
    state.isLoaded = false
  }

  return {
    permissions: computed(() => state.permissions),
    isLoading: computed(() => state.isLoading),
    isLoaded: computed(() => state.isLoaded),

    fetchPermissions,
    resetPermissions,
  }
}
