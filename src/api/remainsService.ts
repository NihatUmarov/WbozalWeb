import httpClient from './httpClient'
import type { RemainItem } from './types'

export interface IRemainsService {
  getRemains(isDefect?: boolean): Promise<RemainItem[]>
}
export const remainsService: IRemainsService = {
  async getRemains(isDefect = false): Promise<RemainItem[]> {
    const { data } = await httpClient.post<RemainItem[]>('/api/seller/remains/get_remains', {
      isDefect: isDefect,
    })
    return data
  },
}
