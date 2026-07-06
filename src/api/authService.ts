import httpClient from './httpClient'
import type { LoginResponse } from './types'

export const authService = {
  async sendOtp(email: string): Promise<{ msg: string }> {
    // Бэкенд ждет [FromQuery] string email, передаем через params
    const { data } = await httpClient.post<{ msg: string }>('/api/auth/email_send_otp', null, {
      params: { email },
    })
    return data
  },

  async verifyOtp(email: string, otp: string): Promise<LoginResponse> {
    // Бэкенд ждет [FromQuery] string email, [FromQuery] string otp
    const { data } = await httpClient.post<LoginResponse>('/api/auth/email_verify_otp', null, {
      params: { email, otp },
    })

    localStorage.setItem('access_token', data.tok)
    localStorage.setItem('refresh_token', data.rf_tok)

    return data
  },

  async switchProfile(
    targetJurpersonId: number | null,
  ): Promise<{ message: string; tok: string; rf_tok: string }> {
    const currentRefreshToken = localStorage.getItem('refresh_token') || ''

    // Бэкенд ждет [FromQuery] string refreshToken, [FromQuery] int? targetJurpersonId
    const { data } = await httpClient.post<{ message: string; tok: string; rf_tok: string }>(
      '/api/auth/switch_profile',
      null,
      {
        params: {
          refreshToken: currentRefreshToken,
          targetJurpersonId,
        },
      },
    )

    if (data.tok && data.rf_tok) {
      localStorage.setItem('access_token', data.tok)
      localStorage.setItem('refresh_token', data.rf_tok)
    }

    return data
  },
}
