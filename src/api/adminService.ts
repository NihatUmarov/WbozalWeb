import { reactive, computed } from 'vue'
import httpClient from './httpClient'

export interface UserPermissionsResponse { admin: boolean; remains: boolean; invoice: boolean; cards: boolean; profile: boolean }
export interface UserBatchItem { id: number; email: string; remains: boolean; invoice: boolean; cards: boolean; profile: boolean }

const state = reactive({
  permissions: { remains: false, invoice: false, cards: false, profile: false, admin: false } as UserPermissionsResponse,
  isLoading: false,
  isLoaded: false,
})

export const adminService = {
  permissions: computed(() => state.permissions),
  isLoading: computed(() => state.isLoading),
  isLoaded: computed(() => state.isLoaded),

  getPermissions: () => {
    state.isLoading = true
    return httpClient.get<UserPermissionsResponse>('/api/admin/get_permissions').then(r => {
      state.permissions = r.data
      state.isLoaded = true
      return r.data
    }).catch(err => {
      adminService.resetPermissions()
      throw err
    }).finally(() => state.isLoading = false)
  },

  resetPermissions: () => {
    state.permissions = { remains: false, invoice: false, cards: false, profile: false, admin: false }
    state.isLoaded = false
  },

  getJurpersonUsers: () => httpClient.get<UserBatchItem[]>('/api/admin/get_users').then(r => r.data),
  syncUsers: (payload: UserBatchItem[]) => httpClient.post<{ message: string }>('/api/admin/sync_users', payload).then(r => r.data),
}
