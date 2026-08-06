import httpClient from './httpClient'
import type { Product, MarketplaceStatResponse, MarketplaceStat } from './types'

export interface StopListItem extends Product {
  isActive: boolean
  updatedAt: string | null
}

export interface CardDetailItem extends Product {
  color: string | null
  country: string | null
  width: number | null
  height: number | null
  length: number | null
  volume: number | null
  volumeLiter: number | null
  cJurperson: string | null
  brandName: string | null
  photos: string[]
  components: KitComponent[]
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

export interface LabelElement {
  type: string; field: string; prefix: string | null; x: number; y: number; w: number; h: number; fontSize: number; isBold: boolean
}
export interface LabelTemplate { idName: number; cLabelType: string; elements: LabelElement[]; isCustom: boolean }
export interface SaveLabelRequest { idName: number; cLabelType: string; elements: LabelElement[] }
export interface SaveKitRequest { idParentName: number; components: { idChildName: number; qty: number }[] }

export interface MarketplaceProduct {
  marketplaceName: string
  color: string | null
  size: string | null
  isActive: boolean
  linkedIdName: number | null
  linkedName: string | null
  linkedArt: string | null
  linkedImage: string | null
  isLinkedToKit: boolean
  barcodes: string[]
  // Normalize fields
  cName?: string
  cArt?: string
  primaryImageURL?: string | null
}

export interface OzonProduct extends MarketplaceProduct {
  idOzonProduct: number
  idProduct: number
  sku: number
  marking: string
}

export interface WbProduct extends MarketplaceProduct {
  idChrt: number
  idNm: number
  vendorCode: string
}

// --- Внутренняя нормализация для гарантированной чистоты данных ---
const normalize = <T extends object>(p: unknown): T => {
  const raw = p as Record<string, unknown>
  const b = (raw.barcodes || raw.Barcodes || raw.RawBarcodes || raw.barcode || []) as string | string[]

  // Handle case sensitivity and different naming conventions
  const idName = (raw.idName || raw.IdName || raw.linkedIdName || 0) as number
  const primaryImageURL = (raw.primaryImageURL || raw.PrimaryImageURL || raw.primaryImage || raw.linkedImage || null) as string | null
  const cName = (raw.cName || raw.CName || raw.marketplaceName || raw.MarketplaceName || 'Без названия') as string
  const cArt = (raw.cArt || raw.CArt || raw.marking || raw.Marking || raw.vendorCode || raw.VendorCode || '—') as string

  return {
    ...raw,
    idName,
    primaryImageURL,
    cName,
    cArt,
    idOzonProduct: raw.idOzonProduct || raw.IdOzonProduct,
    idChrt: raw.idChrt || raw.IdChrt,
    marking: raw.marking || raw.Marking,
    vendorCode: raw.vendorCode || raw.VendorCode,
    marketplaceName: raw.marketplaceName || raw.MarketplaceName || cName,
    size: (raw.size || raw.Size || '—') as string,
    barcodes: Array.isArray(b) ? b : (typeof b === 'string' ? b.split(',') : [String(b)]),
    irQuant: (raw.irQuant || raw.IrQuant || 0) as number,
    iBronTask: (raw.iBronTask || raw.IBronTask || 0) as number,
    defectQuant: (raw.defectQuant || raw.DefectQuant || 0) as number,
    isDefect: !!(raw.isDefect ?? raw.IsDefect ?? false),
    isKit: !!(raw.isKit ?? raw.IsKit ?? false),
    isActive: !!(raw.isActive ?? raw.IsActive ?? true),
  } as unknown as T
}

export const productService = {
  getProducts: () => httpClient.get<Product[]>('/api/seller/cards/get').then(r => r.data.map(p => normalize<Product>(p))),
  getRemains: (isDefect = false) => httpClient.post<Product[]>('/api/seller/remains/get_remains', null, { params: { isDefect } }).then(r => r.data.map(p => normalize<Product>(p))),
  getProductById: (id: number) => httpClient.get<CardDetailItem>(`/api/seller/cards/${id}`).then(r => normalize<CardDetailItem>(r.data)),
  deleteProduct: (id: number) => httpClient.delete<{ success: boolean; message: string }>(`/api/seller/cards/${id}`).then(r => r.data),

  getLabelTemplate: (id: number, defaultType = '60x40') => httpClient.get<LabelTemplate>(`/api/seller/cards/${id}/label`, { params: { defaultType } }).then(r => r.data),
  saveLabelTemplate: (payload: SaveLabelRequest) => httpClient.post<{ success: boolean }>('/api/seller/cards/label/save', payload).then(r => r.data),

  saveKit: (payload: SaveKitRequest) => httpClient.post<{ success: boolean; message: string }>('/api/seller/cards/kit/save', payload).then(r => r.data),
  deleteKit: (id: number) => httpClient.delete<{ success: boolean; message: string }>(`/api/seller/cards/kit/${id}`).then(r => r.data),
  bulkSaveKits: (payload: { kits: SaveKitRequest[] }) => httpClient.post<{ success: boolean; message: string }>('/api/seller/cards/kit/bulk-save', payload).then(r => r.data),

  getOzonProducts: () => httpClient.get<OzonProduct[]>('/api/seller/cards/ozon').then(r => r.data.map(p => normalize<OzonProduct>(p))),
  getWbProducts: () => httpClient.get<WbProduct[]>('/api/seller/cards/wb').then(r => r.data.map(p => normalize<WbProduct>(p))),
  linkOzonProduct: (p: { idOzonProduct: number; newIdName: number | null }) => httpClient.post('/api/seller/cards/ozon/link', p),
  linkWbProduct: (p: { idChrt: number; newIdName: number | null }) => httpClient.post('/api/seller/cards/wb/link', p),
  syncMarketplaces: () => httpClient.post<{ message: string }>('/api/seller/cards/sync').then(r => r.data),
  toggleOzonActive: (p: { idOzonProduct: number; isActive: boolean }) => httpClient.post('/api/seller/cards/ozon/active', p),
  toggleWbActive: (p: { idChrt: number; isActive: boolean }) => httpClient.post('/api/seller/cards/wb/active', p),
  bulkUpdateMarketplaceActive: (p: { marketplace: string; barcodes: string[]; isActive: boolean }) => httpClient.post('/api/seller/cards/bulk-update-active', p),

  getStats: () => httpClient.get<MarketplaceStatResponse | MarketplaceStat[]>('/api/seller/cards/stats').then(r => r.data),
}
