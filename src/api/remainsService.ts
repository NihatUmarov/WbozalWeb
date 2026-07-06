import httpClient from './httpClient'

export interface RemainItem {
  idName: number
  primaryImageURL: string | null
  barcode: string | null
  size: string | null
  irQuant: number
  iBronTask: number
  isDefect: boolean
  cName: string | null
  cArt: string | null
  cArtWB: string | null
}

export interface IRemainsService {
  getRemains(isDefect?: boolean): Promise<RemainItem[]>
}

export const remainsService: IRemainsService = {
  async getRemains(isDefect = false): Promise<RemainItem[]> {
    const { data } = await httpClient.post<RemainItem[]>('/api/seller/remains/get_remains', null, {
      params: { isDefect },
    })
    return data
  },
}
