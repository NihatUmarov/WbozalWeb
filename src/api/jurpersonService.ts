import httpClient from './httpClient'
import type {
  JurpersonInfoResponse, UpdateJurpersonRequest, UpdateJurpersonResponse,
  GetJurpersonsResponse, CreateJurpersonRequest, CreateJurpersonResponse,
  SuggestByInnResponse, MarketplaceTokenResponse, SaveMarketplaceTokenRequest,
} from './types'

export const jurpersonService = {
  getJurperson: () => httpClient.post<JurpersonInfoResponse>('/api/jurperson/get_info_jurperson').then(r => r.data),
  updateJurperson: (p: UpdateJurpersonRequest) => httpClient.post<UpdateJurpersonResponse>('/api/jurperson/update_info_jurperson', p).then(r => r.data),
  getJurpersons: () => httpClient.get<GetJurpersonsResponse>('/api/jurperson/get_jurpersons').then(r => r.data),
  suggestByInn: (inn: string) => httpClient.get<SuggestByInnResponse>(`/api/jurperson/suggest_by_inn/${inn}`).then(r => r.data),
  createJurperson: (p: CreateJurpersonRequest) => httpClient.post<CreateJurpersonResponse>('/api/jurperson/create_jurperson', p).then(r => r.data),
  getMarketplaceTokenByType: (marketplace: 'WB' | 'OZ') => httpClient.post<MarketplaceTokenResponse | null>('/api/jurperson/get_marketplace_token_by_type', null, { params: { marketplace } }).then(r => r.data),
  saveMarketplaceToken: (p: SaveMarketplaceTokenRequest) => httpClient.post<{ message: string }>('/api/jurperson/save_marketplace_token', p).then(r => r.data),
}
