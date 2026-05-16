import httpClient from './httpClient'
import type {
  BrandInfoResponse,
  UpdateBrandRequest,
  UpdateBrandResponse,
  GetBrandsResponse,
} from './types'

export const brandService = {
  async getBrand(): Promise<BrandInfoResponse> {
    const { data } = await httpClient.post<BrandInfoResponse>('/api/seller/get_info_brand')
    return data
  },

  // 2. Обновить данные бренда
  async updateBrand(payload: UpdateBrandRequest): Promise<UpdateBrandResponse> {
    const { data } = await httpClient.post<UpdateBrandResponse>(
      '/api/seller/update_info_brand',
      payload,
    )
    return data
  },

  // 3. Получить все бренды
  async getBrands(): Promise<GetBrandsResponse> {
    const { data } = await httpClient.post<GetBrandsResponse>('/api/seller/get_brands')
    return data
  },

  // 4. Записать выбранный бренд в базу данных
  async selectBrand(idBrand: number): Promise<{ message: string }> {
    const { data } = await httpClient.post<{ message: string }>('/api/seller/select_brand', {
      idBrand,
    })
    return data
  },
}
