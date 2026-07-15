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
  isKit?: boolean
}

export interface KitComponent {
  idName: number
  qty: number
  cName: string | null
  cArt: string | null
  size: string | null
  color: string | null
  primaryImageURL: string | null
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
  isKit: boolean // <-- НОВОЕ ПОЛЕ
  components: KitComponent[] // <-- СОСТАВ КОМПЛЕКТА
}

// Типы для этикеток
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

// Типы для комплектов
export interface KitComponentInputDto {
  idChildName: number
  qty: number
}

export interface SaveKitRequest {
  idParentName: number
  components: KitComponentInputDto[]
}

// Типы для Маркетплейсов
export interface MarketplaceProduct {
  marketplaceName: string
  color: string | null
  size: string | null
  linkedIdName: number | null
  linkedName: string | null
  linkedArt: string | null
  isLinkedToKit: boolean
}

export interface OzonProduct extends MarketplaceProduct {
  idOzonProduct: number
  idProduct: number
  sku: string
  marking: string
}

export interface WbProduct extends MarketplaceProduct {
  idChrt: number
  idNm: number
  vendorCode: string
}

export interface LinkOzonRequest {
  idOzonProduct: number
  newIdName: number | null
}

export interface LinkWbRequest {
  idChrt: number
  newIdName: number | null
}

export interface ICardsService {
  getCards(): Promise<CardItem[]>
  getCardById(idName: number): Promise<CardDetailItem>
  getLabelTemplate(idName: number, defaultType?: string): Promise<LabelTemplate>
  saveLabelTemplate(data: SaveLabelRequest): Promise<{ success: boolean }>

  // Комплекты
  saveKit(data: SaveKitRequest): Promise<{ success: boolean; message: string }>
  deleteKit(idName: number): Promise<{ success: boolean; message: string }>

  // Карточки (НОВЫЙ МЕТОД ДЛЯ БЭКЕНДА)
  deleteCard(idName: number): Promise<{ success: boolean; message: string }>

  // Маркетплейсы
  getOzonProducts(): Promise<OzonProduct[]>
  getWbProducts(): Promise<WbProduct[]>
  linkOzonProduct(data: LinkOzonRequest): Promise<{ success: boolean; message: string }>
  linkWbProduct(data: LinkWbRequest): Promise<{ success: boolean; message: string }>
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

  async deleteCard(idName: number) {
    const { data } = await httpClient.delete<{ success: boolean; message: string }>(
      `/api/seller/cards/${idName}`,
    )
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

  async saveKit(payload: SaveKitRequest) {
    const { data } = await httpClient.post<{ success: boolean; message: string }>(
      '/api/seller/cards/kit/save',
      payload,
    )
    return data
  },

  async deleteKit(idName: number) {
    const { data } = await httpClient.delete<{ success: boolean; message: string }>(
      `/api/seller/cards/kit/${idName}`,
    )
    return data
  },

  async getOzonProducts() {
    const { data } = await httpClient.get<OzonProduct[]>('/api/seller/cards/ozon')
    return data
  },

  async getWbProducts() {
    const { data } = await httpClient.get<WbProduct[]>('/api/seller/cards/wb')
    return data
  },

  async linkOzonProduct(payload: LinkOzonRequest) {
    const { data } = await httpClient.post<{ success: boolean; message: string }>(
      '/api/seller/cards/ozon/link',
      payload,
    )
    return data
  },

  async linkWbProduct(payload: LinkWbRequest) {
    const { data } = await httpClient.post<{ success: boolean; message: string }>(
      '/api/seller/cards/wb/link',
      payload,
    )
    return data
  },
}
