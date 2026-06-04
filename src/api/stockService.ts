import httpClient from './httpClient'
import type { GetStockDocumentsRequest, StockDocument } from './types'

export interface CreateDocumentItemPayload {
  idName: number
  barcode: string
  qty: number
}

export interface CreateStockDocumentPayload {
  model: 'FBO' | 'ORD'
  comment: string
  phone: string
  direction: string
  eventDate: string | null
  items: CreateDocumentItemPayload[]
}

export interface StockDocumentDetailItem {
  id: number
  idRSIncome: number
  idName: number
  article: string | null
  name: string | null
  barcode: string | null
  qty: number
  qtyFact: number
  qtyDefect: number
}

export const stockService = {
  async getDocuments(payload: GetStockDocumentsRequest): Promise<StockDocument[]> {
    const { data } = await httpClient.post<StockDocument[]>(
      '/api/seller/get_stock_documents',
      payload,
    )
    return data
  },

  async createDocument(
    payload: CreateStockDocumentPayload,
  ): Promise<{ message: string; id: number }> {
    const { data } = await httpClient.post<{ message: string; id: number }>(
      '/api/seller/create_stock_document',
      payload,
    )
    return data
  },

  async getDocumentDetails(idRSIncome: number): Promise<StockDocumentDetailItem[]> {
    const { data } = await httpClient.post<StockDocumentDetailItem[]>(
      '/api/seller/get_stock_document_details',
      { idRSIncome },
    )
    return data
  },
}
