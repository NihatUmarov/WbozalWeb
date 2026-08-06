import httpClient from './httpClient'
import type { MarketplaceStat } from './types'

export interface MarketplaceProduct {
  marketplaceName: string
  color: string | null
  size: string | null
  linkedIdName: number | null
  linkedName: string | null
  linkedArt: string | null
  linkedImage: string | null
  isLinkedToKit: boolean
  isActive: boolean
  barcodes: string[]
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

const normalize = <T extends object>(p: unknown): T => {
  const raw = p as Record<string, unknown>
  const b = (raw.barcodes || raw.Barcodes || raw.RawBarcodes || raw.barcode || []) as string | string[]
  return {
    ...raw,
    barcodes: Array.isArray(b) ? b : (typeof b === 'string' ? b.split(',') : [String(b)]),
    isActive: !!(raw.isActive ?? raw.IsActive ?? true),
    isLinkedToKit: !!(raw.isLinkedToKit ?? raw.IsLinkedToKit ?? false),
  } as unknown as T
}

export const marketplaceService = {
  getWeeklyStats: () =>
    httpClient.get<MarketplaceStat[]>('/api/marketplace/stats').then((r) => r.data),

  getOzonProducts: () =>
    httpClient.get<OzonProduct[]>('/api/marketplace/ozon').then((r) => r.data.map((p) => normalize<OzonProduct>(p))),

  getWbProducts: () =>
    httpClient.get<WbProduct[]>('/api/marketplace/wb').then((r) => r.data.map((p) => normalize<WbProduct>(p))),

  linkOzonProduct: (p: { idOzonProduct: number; newIdName: number | null }) =>
    httpClient.post<{ success: boolean; message: string }>('/api/marketplace/ozon/link', p).then((r) => r.data),

  linkWbProduct: (p: { idChrt: number; newIdName: number | null }) =>
    httpClient.post<{ success: boolean; message: string }>('/api/marketplace/wb/link', p).then((r) => r.data),

  toggleOzonActive: (p: { idOzonProduct: number; isActive: boolean }) =>
    httpClient.post<{ success: boolean }>('/api/marketplace/ozon/active', p).then((r) => r.data),

  toggleWbActive: (p: { idChrt: number; isActive: boolean }) =>
    httpClient.post<{ success: boolean }>('/api/marketplace/wb/active', p).then((r) => r.data),

  bulkUpdateActive: (p: { marketplace: string; barcodes: string[]; isActive: boolean }) =>
    httpClient.post<{ success: boolean; message: string }>('/api/marketplace/bulk-update-active', p).then((r) => r.data),

  syncMarketplaces: () =>
    httpClient.post<{ success: boolean; message: string }>('/api/marketplace/sync').then((r) => r.data),
}
