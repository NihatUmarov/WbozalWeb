export interface Product {
  idName: number
  primaryImageURL: string | null
  cName: string | null
  cArt: string | null
  cArtWB: string | null
  size: string | null
  barcodes: string[]
  irQuant: number
  iBronTask: number
  defectQuant: number
  isDefect: boolean
  isKit: boolean
}

export interface LoginResponse {
  msg: string
  tok: string
  rf_tok: string
}

export interface RefreshTokenResponse {
  tok: string
  rf_tok: string
}

export interface JurpersonInfoResponse {
  idJurperson: number
  jurpersonName: string | null
  jurpersonFullName: string | null
  jurAdress: string | null
  postAdress: string | null
  inn: string | null
  phone: string | null
  fax: string | null
  kpp: string | null
  email: string | null
  agreeNum: string | null
}

export interface UpdateJurpersonRequest {
  jurpersonName?: string | null
  jurpersonFullName?: string | null
  jurAdress?: string | null
  postAdress?: string | null
  inn?: string | null
  phone?: string | null
  fax?: string | null
  kpp?: string | null
  email?: string | null
  agreeNum?: string | null
}

export interface UpdateJurpersonResponse {
  message: string
}

export interface JurpersonShort {
  idJurperson: number
  jurpersonName: string
  inn: string | null
}

export interface GetJurpersonsResponse {
  jurpersons: JurpersonShort[]
  activeId: number | null
}

export interface CreateJurpersonRequest {
  inn: string
  jurpersonName: string
  jurpersonFullName: string
}

export interface CreateJurpersonResponse {
  message: string
  idJurperson: number
}

export interface SuggestByInnResponse {
  jurpersonName: string
  jurpersonFullName: string
}

export interface SaveMarketplaceTokenRequest {
  marketplace: 'WB' | 'OZ'
  value: string
  appKey: string
  appSecret: string | null
}

export interface MarketplaceTokenResponse {
  marketplace: 'WB' | 'OZ'
  value: string
  appKey: string
  appSecret: string | null
  isActive: boolean
}

export interface MarketplaceStat {
  date: string
  idName: number
  source: 'WB' | 'OZON'
  count: number
  cName: string
  cArt: string
  primaryImageURL: string | null
}

export interface DailyStat {
  date: string
  source: 'WB' | 'OZON'
  count: number
}

export interface SummaryStat {
  idName: number
  source: 'WB' | 'OZON'
  count: number
  cName: string
  cArt: string
  primaryImageURL: string | null
}

export interface MarketplaceStatResponse {
  daily: DailyStat[]
  summary: SummaryStat[]
  details: MarketplaceStat[]
}
