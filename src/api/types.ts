// Auth Types
export interface SendOtpRequest {
  em: string
}

export interface SendOtpResponse {
  msg: string
}

export interface VerifyOtpRequest {
  em: string
  otp: string
}

export interface LoginResponse {
  msg: string
  tok: string
  rf_tok: string
  role: string
}

export interface RefreshTokenRequest {
  t_tok: string
  rf_tok: string
}

export interface RefreshTokenResponse {
  tok: string
  rf_tok: string
  role: string
}

export interface SwitchProfileRequest {
  jid: number | null
}

export interface SwitchProfileResponse {
  msg: string
  tok: string
  rf_tok: string
  role: string
}

// Jurperson Types
export interface JurpersonInfoResponse {
  idJurperson: number
  jurpersonName: string | null
  jurpersonFullName: string | null
  jurAdress: string | null
  postAdress: string | null
  rAccount: string | null
  kAccount: string | null
  bik: string | null
  inn: string | null
  bank: string | null
  okonh: string | null
  okpo: string | null
  phone: string | null
  fax: string | null
  outIdJurperson: string | null
  bLogistic: boolean | null
  iExpPercentMin: number | null
  iExpDayMin: number | null
  kpp: string | null
  email: string | null
  agreeNum: string | null
}

export interface UpdateJurpersonRequest {
  jurpersonName?: string | null
  jurpersonFullName?: string | null
  jurAdress?: string | null
  postAdress?: string | null
  rAccount?: string | null
  kAccount?: string | null
  bik?: string | null
  inn?: string | null
  bank?: string | null
  okonh?: string | null
  okpo?: string | null
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

export interface SelectJurpersonRequest {
  idJurperson: number
}

export interface SelectJurpersonResponse {
  message: string
  tok: string
  rf_tok: string
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
  barcodes: string[]
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
