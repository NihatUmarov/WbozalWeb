import httpClient from './httpClient'
import type { Product } from './types'

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
export interface MarketplaceProduct { marketplaceName: string; color: string | null; size: string | null; linkedIdName: number | null; linkedName: string | null; linkedArt: string | null; linkedImage: string | null; isLinkedToKit: boolean; isActive: boolean; barcodes: string[] }
export interface OzonProduct extends MarketplaceProduct { idOzonProduct: number; idProduct: number; sku: string; marking: string }
export interface WbProduct extends MarketplaceProduct { idChrt: number; idNm: number; vendorCode: string }

// --- Внутренняя нормализация для гарантированной чистоты данных ---
const normalize = <T extends Record<string, unknown>>(p: unknown): T => {
  const raw = p as Record<string, unknown>
  return {
    ...raw,
    barcodes: Array.isArray(raw.barcodes) ? raw.barcodes : (raw.RawBarcodes ? String(raw.RawBarcodes).split(',') : (raw.barcode ? [String(raw.barcode)] : [])),
    cName: (raw.cName as string) || (raw.marketplaceName as string) || 'Без названия',
    cArt: (raw.cArt as string) || (raw.marking as string) || (raw.vendorCode as string) || '—',
    size: (raw.size as string) || '—',
    irQuant: (raw.irQuant as number) || 0,
    iBronTask: (raw.iBronTask as number) || 0,
    defectQuant: (raw.defectQuant as number) || 0,
    isDefect: !!raw.isDefect,
    isKit: !!raw.isKit,
    isActive: raw.isActive !== undefined ? !!raw.isActive : (raw.IsActive !== undefined ? !!raw.IsActive : true),
    linkedImage: (raw.linkedImage as string) || (raw.PrimaryImageURL as string) || (raw.primaryImage as string) || null
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

  syncMarketplaces: () => httpClient.post<{ success: boolean; message: string }>('/api/seller/cards/sync').then(r => r.data),
  getOzonProducts: () => httpClient.get<OzonProduct[]>('/api/seller/cards/ozon').then(r => r.data.map(p => normalize<OzonProduct>(p))),
  getWbProducts: () => httpClient.get<WbProduct[]>('/api/seller/cards/wb').then(r => r.data.map(p => normalize<WbProduct>(p))),
  linkOzonProduct: (p: { idOzonProduct: number; newIdName: number | null }) => httpClient.post<{ success: boolean; message: string }>('/api/seller/cards/ozon/link', p).then(r => r.data),
  linkWbProduct: (p: { idChrt: number; newIdName: number | null }) => httpClient.post<{ success: boolean; message: string }>('/api/seller/cards/wb/link', p).then(r => r.data),
  toggleOzonActive: (p: { idOzonProduct: number; isActive: boolean }) => httpClient.post<{ success: boolean }>('/api/seller/cards/ozon/active', p).then(r => r.data),
  toggleWbActive: (p: { idChrt: number; isActive: boolean }) => httpClient.post<{ success: boolean }>('/api/seller/cards/wb/active', p).then(r => r.data),
  bulkUpdateActive: (p: { marketplace: string; barcodes: string[]; isActive: boolean }) => httpClient.post<{ success: boolean; message: string }>('/api/seller/cards/bulk-update-active', p).then(r => r.data),
}
