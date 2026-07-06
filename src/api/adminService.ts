import { reactive, computed } from 'vue'
import httpClient from './httpClient'

// --- ИНТЕРФЕЙСЫ ЗЕРКАЛИРУЮТ ПОЛЯ ИЗ AdminController.cs ---
export interface UserPermissionsResponse {
  admin: boolean
  remains: boolean
  invoice: boolean
  cards: boolean
  profile: boolean
}

export interface UserBatchItem {
  id: number
  email: string
  remains: boolean
  invoice: boolean
  cards: boolean
  profile: boolean
}

// --- ЛОКАЛЬНОЕ РЕАКТИВНОЕ СОСТОЯНИЕ (Бывшее хранилище) ---
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

// --- ЕДИНЫЙ ОБЪЕКТ УПРАВЛЕНИЯ И API ---
export const adminService = {
  // Глобальные реактивные геттеры для Vue-компонентов и Router
  permissions: computed(() => state.permissions),
  isLoading: computed(() => state.isLoading),
  isLoaded: computed(() => state.isLoaded),

  // Получение прав с автоматической записью в State
  async getPermissions(): Promise<UserPermissionsResponse> {
    state.isLoading = true
    try {
      const { data } = await httpClient.get<UserPermissionsResponse>('/api/admin/get_permissions')
      state.permissions = data
      state.isLoaded = true
      return data
    } catch (error) {
      console.error('Ошибка при получении прав доступа:', error)
      this.resetPermissions()
      throw error
    } finally {
      state.isLoading = false
    }
  },

  // Сброс состояния при разлогине или смене профиля
  resetPermissions(): void {
    state.permissions = {
      remains: false,
      invoice: false,
      cards: false,
      profile: false,
      admin: false,
    }
    state.isLoaded = false
  },

  // Административные методы управления пользователями юрлица
  async getJurpersonUsers(): Promise<UserBatchItem[]> {
    const { data } = await httpClient.get<UserBatchItem[]>('/api/admin/get_users')
    return data
  },

  async syncUsers(payload: UserBatchItem[]): Promise<{ message: string }> {
    const { data } = await httpClient.post<{ message: string }>('/api/admin/sync_users', payload)
    return data
  },
}
