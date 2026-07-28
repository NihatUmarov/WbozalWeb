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
  expirationDate: string | null
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
  getDocuments: (model: string, archive = false) =>
    httpClient.post<StockDocument[]>('/api/seller/get_invoice', null, { params: { model, archive } }).then(r => r.data),

  createDocument: (payload: CreateStockDocumentPayload) =>
    httpClient.post<{ message: string; id: number }>('/api/seller/create_invoice', payload).then(r => r.data),

  getDocumentDetails: (idRSIncome: number) =>
    httpClient.post<StockDocumentDetailItem[]>('/api/seller/get_invoice_details', null, { params: { idRSIncome } }).then(r => r.data),

  cancelDocument: (idRSIncome: number) =>
    httpClient.post<{ message: string }>('/api/seller/cancel_invoice', null, { params: { idRSIncome } }).then(r => r.data),

  getInvoiceHeader: (idRSIncome: number) =>
    httpClient.post<InvoiceHeaderData>('/api/seller/get_invoice_header', null, { params: { idRSIncome } }).then(r => r.data),

  updateInvoiceHeader: (payload: UpdateInvoiceHeaderPayload) =>
    httpClient.post<{ message: string }>('/api/seller/update_invoice_header', payload).then(r => r.data),
}
