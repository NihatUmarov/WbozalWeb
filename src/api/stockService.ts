import httpClient from './httpClient'
import type { GetStockDocumentsRequest, StockDocument } from './types'

export const stockService = {
  async getDocuments(payload: GetStockDocumentsRequest): Promise<StockDocument[]> {
    const { data } = await httpClient.post<StockDocument[]>(
      '/api/seller/get_stock_documents',
      payload,
    )
    return data
  },
}
