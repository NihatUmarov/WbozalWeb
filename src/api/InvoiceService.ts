import httpClient from './httpClient'

export interface InvoiceHeaderData {
  id: number
  ts: string
  model: 'FBO' | 'ORD' | 'DEF'
  direction: string | null
  eventDate: string | null
  comment: string | null
}

export interface UpdateInvoiceHeaderPayload {
  idRSIncome: number
  direction: string | null
  eventDate: string | null
  comment: string | null
}

export interface CreateDocumentItemPayload {
  idName: number
  barcode: string
  qty: number
  isDefect?: boolean
  expirationDate?: string | null
}

export interface CreateStockDocumentPayload {
  model: 'FBO' | 'ORD'
  comment: string
  phone: string
  direction: string | null
  eventDate: string | null
  items: CreateDocumentItemPayload[]
}

export interface StockDocumentDetailItem {
  id: number
  idRSIncome: number
  idName: number
  cArt: string | null
  cArtWB: string | null
  cName: string | null
  barcode: string | null
  size: string | null
  qty: number
  qtyFact: number
  qtyDefect: number
  expirationDate: string | null // <-- Добавили сюда
}

export interface StockDocument {
  id: number
  date: string
  model: string
  status: string
  direction: string | null
  quantity: number
  quantityFact: number
  quantityDefect: number
  workDay: string | null
}

export const stockService = {
  async getDocuments(model: string, archive = false): Promise<StockDocument[]> {
    // Бэкенд теперь принимает параметры через строку запроса [FromQuery]
    const { data } = await httpClient.post<StockDocument[]>('/api/seller/get_invoice', null, {
      params: { model, archive },
    })
    return data
  },

  async createDocument(
    payload: CreateStockDocumentPayload,
  ): Promise<{ message: string; id: number; idInvoice?: number; report?: string }> {
    const { data } = await httpClient.post<{
      message: string
      id: number
      idInvoice?: number
      report?: string
    }>('/api/seller/create_invoice', payload)
    return data
  },

  async getDocumentDetails(idRSIncome: number): Promise<StockDocumentDetailItem[]> {
    // Бэкенд ждет [FromQuery] int idRSIncome
    const { data } = await httpClient.post<StockDocumentDetailItem[]>(
      '/api/seller/get_invoice_details',
      null,
      { params: { idRSIncome } },
    )
    return data
  },

  async cancelDocument(idRSIncome: number): Promise<{ message: string }> {
    // Бэкенд ждет [FromQuery] int idRSIncome
    const { data } = await httpClient.post<{ message: string }>(
      '/api/seller/cancel_invoice',
      null,
      {
        params: { idRSIncome },
      },
    )
    return data
  },

  async getInvoiceHeader(idRSIncome: number): Promise<InvoiceHeaderData> {
    // Бэкенд ждет [FromQuery] int idRSIncome
    const { data } = await httpClient.post<InvoiceHeaderData>(
      '/api/seller/get_invoice_header',
      null,
      {
        params: { idRSIncome },
      },
    )
    return data
  },

  async updateInvoiceHeader(payload: UpdateInvoiceHeaderPayload): Promise<{ message: string }> {
    const { data } = await httpClient.post<{ message: string }>(
      '/api/seller/update_invoice_header',
      payload,
    )
    return data
  },
}
