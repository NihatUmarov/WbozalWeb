import httpClient from './httpClient'
import type { CardItem } from './types'

export interface ICardsService {
  getCards(): Promise<CardItem[]>
}

export const cardsService: ICardsService = {
  async getCards(): Promise<CardItem[]> {
    // Делаем POST-запрос на наш новый эндпоинт карточек
    const { data } = await httpClient.post<CardItem[]>('/api/seller/cards/get')
    return data
  },
}
