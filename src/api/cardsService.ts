import httpClient from './httpClient'

export interface CardItem {
  idName: number
  primaryImageURL: string | null
  cName: string | null
  cArt: string | null
  cArtWB: string | null
  size: string | null
  irQuant: number
  iBronTask: number
  defectQuant: number
  barcodes: string[]
}

export interface CardDetailItem {
  idName: number
  cName: string | null
  cArt: string | null
  color: string | null
  size: string | null
  country: string | null
  primaryImageURL: string | null
  width: number | null
  height: number | null
  length: number | null
  volume: number | null
  volumeLiter: number | null
  cJurperson: string | null
  brandName: string | null
  irQuant: number
  iBronTask: number
  defectQuant: number
  barcodes: string[]
  photos: string[]
}

export interface LabelElement {
  type: string
  field: string
  prefix: string | null
  x: number
  y: number
  w: number
  h: number
  fontSize: number
  isBold: boolean
}

export interface LabelTemplate {
  idName: number
  cLabelType: string
  elements: LabelElement[]
  isCustom: boolean
}

export interface SaveLabelRequest {
  idName: number
  cLabelType: string
  elements: LabelElement[]
}

export interface ICardsService {
  getCards(): Promise<CardItem[]>
  getCardById(idName: number): Promise<CardDetailItem>
  getLabelTemplate(idName: number, defaultType?: string): Promise<LabelTemplate>
  saveLabelTemplate(data: SaveLabelRequest): Promise<{ success: boolean }>
}

export const cardsService: ICardsService = {
  async getCards(): Promise<CardItem[]> {
    const { data } = await httpClient.get<CardItem[]>('/api/seller/cards/get')
    return data
  },

  async getCardById(idName: number): Promise<CardDetailItem> {
    const { data } = await httpClient.get<CardDetailItem>(`/api/seller/cards/${idName}`)
    return data
  },

  async getLabelTemplate(idName: number, defaultType = '60x40'): Promise<LabelTemplate> {
    const { data } = await httpClient.get<LabelTemplate>(`/api/seller/cards/${idName}/label`, {
      params: { defaultType },
    })
    return data
  },

  async saveLabelTemplate(payload: SaveLabelRequest): Promise<{ success: boolean }> {
    const { data } = await httpClient.post<{ success: boolean }>(
      '/api/seller/cards/label/save',
      payload,
    )
    return data
  },
}
