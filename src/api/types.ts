// Auth Types
export interface SendOtpRequest {
  email: string
}

export interface SendOtpResponse {
  message: string
  expiresAt: string
}

export interface VerifyOtpRequest {
  email: string
  otp: string
}

export interface LoginResponse {
  message: string
  token: string
  refreshToken: string
  userPublicId: string
}

export interface RefreshTokenRequest {
  accessToken: string
  refreshToken: string
}

export interface RefreshTokenResponse {
  token: string
  refreshToken: string
}

export interface BrandInfoResponse {
  idBrand: number
  brandName: string | null
  sellerName: string | null
  sellerFullName: string | null
  emailWork: string | null
  phoneWork: string | null
  adress: string | null
  inn: string | null
  wbToken: string | null
  ozToken: string | null
  sberToken: string | null
  ymToken: string | null
}

export interface UpdateBrandRequest {
  brandName: string | null
  sellerName: string | null
  sellerFullName: string | null
  emailWork: string | null
  phoneWork: string | null
  adress: string | null
  inn: string | null
}

export interface UpdateBrandResponse {
  message: string
}

export interface BrandShort {
  idBrand: number
  brandName: string
}

export interface GetBrandsResponse {
  brands: BrandShort[]
  selectedBrandId: number | null
}

// Stock Documents Types
export interface GetStockDocumentsRequest {
  model: string
  archive: boolean
}

export interface StockDocument {
  id: number
  date: string
  model: string
  status: string
  quantity: number
  quantityFact: number
  quantityDefect: number
}

export interface RemainItem {
  idName: number | null
  barcode: string | null
  irQuant: number
  iBronTask: number | null
  isDefect: boolean
  cName: string | null
  cArt: string | null
}

export interface CardItem {
  idName: number
  cName: string | null
  cArt: string | null
  irQuant: number
  iBronTask: number
  defectQuant: number
  barcodes: string[] // Наш массив мульти-ШК
}
