import httpClient from './httpClient'
import type {
  JurpersonInfoResponse,
  UpdateJurpersonRequest,
  UpdateJurpersonResponse,
  GetJurpersonsResponse,
} from './types'

export const brandService = {
  async getBrand(): Promise<JurpersonInfoResponse> {
    const { data } = await httpClient.post<JurpersonInfoResponse>(
      '/api/jurperson/get_info_jurperson',
    )
    return data
  },

  async updateBrand(payload: UpdateJurpersonRequest): Promise<UpdateJurpersonResponse> {
    const { data } = await httpClient.post<UpdateJurpersonResponse>(
      '/api/jurperson/update_info_jurperson',
      payload,
    )
    return data
  },

  async getBrands(): Promise<GetJurpersonsResponse> {
    const { data } = await httpClient.post<GetJurpersonsResponse>('/api/jurperson/get_jurpersons')
    return data
  },

  async selectBrand(idJurperson: number): Promise<{ message: string }> {
    const { data } = await httpClient.post<{ message: string }>('/api/jurperson/select_jurperson', {
      idJurperson,
    })
    return data
  },
}
