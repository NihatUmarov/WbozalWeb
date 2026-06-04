import httpClient from './httpClient'
import type {
  JurpersonInfoResponse,
  UpdateJurpersonRequest,
  UpdateJurpersonResponse,
  GetJurpersonsResponse,
  CreateJurpersonRequest,
  CreateJurpersonResponse,
  SuggestByInnResponse,
} from './types'

export const jurpersonService = {
  async getJurperson(): Promise<JurpersonInfoResponse> {
    const { data } = await httpClient.post<JurpersonInfoResponse>(
      '/api/jurperson/get_info_jurperson',
    )
    return data
  },

  async updateJurperson(payload: UpdateJurpersonRequest): Promise<UpdateJurpersonResponse> {
    const { data } = await httpClient.post<UpdateJurpersonResponse>(
      '/api/jurperson/update_info_jurperson',
      payload,
    )
    return data
  },

  async getJurpersons(): Promise<GetJurpersonsResponse> {
    const { data } = await httpClient.post<GetJurpersonsResponse>('/api/jurperson/get_jurpersons')
    return data
  },

  async suggestByInn(inn: string): Promise<SuggestByInnResponse> {
    const { data } = await httpClient.get<SuggestByInnResponse>(
      `/api/jurperson/suggest_by_inn/${inn}`,
    )
    return data
  },

  async createJurperson(payload: CreateJurpersonRequest): Promise<CreateJurpersonResponse> {
    const { data } = await httpClient.post<CreateJurpersonResponse>(
      '/api/jurperson/create_jurperson',
      payload,
    )
    return data
  },
}
