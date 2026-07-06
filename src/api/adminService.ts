import httpClient from './httpClient'

export const adminService = {
  async getPermissions(): Promise<UserPermissionsResponse> {
    const { data } = await httpClient.get<UserPermissionsResponse>('/api/admin/get_permissions')
    return data
  },

  async getJurpersonUsers(): Promise<UserBatchItem[]> {
    const { data } = await httpClient.get<UserBatchItem[]>('/api/admin/get_users')
    return data
  },

  async syncUsers(payload: UserBatchItem[]): Promise<{ message: string }> {
    const { data } = await httpClient.post<{ message: string }>('/api/admin/sync_users', payload)
    return data
  },
}

export interface UserBatchItem {
  id: number
  email: string
  remains: boolean
  invoice: boolean
  cards: boolean
  profile: boolean
}

export interface UserPermissionsResponse {
  admin: boolean
  remains: boolean
  invoice: boolean
  cards: boolean
  profile: boolean
}
