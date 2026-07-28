import httpClient from './httpClient'
import type { LoginResponse } from './types'

export const authService = {
  sendOtp: (email: string) => httpClient.post<{ msg: string }>('/api/auth/email_send_otp', null, { params: { email } }).then(r => r.data),

  verifyOtp: (email: string, otp: string) => httpClient.post<LoginResponse>('/api/auth/email_verify_otp', null, { params: { email, otp } }).then(r => {
    localStorage.setItem('access_token', r.data.tok)
    localStorage.setItem('refresh_token', r.data.rf_tok)
    return r.data
  }),

  switchProfile: (targetJurpersonId: number | null) => {
    const refreshToken = localStorage.getItem('refresh_token') || ''
    return httpClient.post<{ message: string; tok: string; rf_tok: string }>('/api/auth/switch_profile', null, { params: { refreshToken, targetJurpersonId } }).then(r => {
      if (r.data.tok && r.data.rf_tok) {
        localStorage.setItem('access_token', r.data.tok)
        localStorage.setItem('refresh_token', r.data.rf_tok)
      }
      return r.data
    })
  },
}
