import httpClient from './httpClient'
import type {
  JurpersonInfoResponse,
  UpdateJurpersonRequest,
  UpdateJurpersonResponse,
  GetJurpersonsResponse,
  SelectJurpersonResponse,
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

  async selectJurperson(idJurperson: number): Promise<SelectJurpersonResponse> {
    const { data } = await httpClient.post<SelectJurpersonResponse>(
      '/api/jurperson/select_jurperson',
      { idJurperson },
    )

    // Если токены прилетели — сразу обновляем их в приложении
    if (data.tok && data.rf_tok) {
      localStorage.setItem('access_token', data.tok)
      localStorage.setItem('refresh_token', data.rf_tok)
    }

    return data
  },
}
