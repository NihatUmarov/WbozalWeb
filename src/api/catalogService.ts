import httpClient from './httpClient' // <-- Импортируем твой рабочий клиент с токенами

export interface CatalogItem {
  idName: number
  primaryImageURL: string | null
  cName: string | null
  cArt: string | null
  cArtWB: string | null
  size: string | null
  barcodes: string[]
  barcode?: string
  irQuant: number
  iBronTask: number
  defectQuant?: number
  isDefect?: boolean
}

export const catalogService = {
  getCards: async (): Promise<CatalogItem[]> => {
    // Используем httpClient вместо axios
    const { data } = await httpClient.get<CatalogItem[]>('/api/seller/cards/get')
    return data
  },

  getRemains: async (isDefect: boolean = false): Promise<CatalogItem[]> => {
    // Используем httpClient вместо axios
    const { data } = await httpClient.post<CatalogItem[]>('/api/seller/remains/get_remains', null, {
      params: { isDefect },
    })
    return data
  },
}
