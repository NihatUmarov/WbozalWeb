import httpClient from './httpClient'
import type { SendOtpRequest, SendOtpResponse, VerifyOtpRequest, LoginResponse } from './types'

export const authService = {
  async sendOtp(email: string): Promise<SendOtpResponse> {
    const { data } = await httpClient.post<SendOtpResponse>('/api/auth/email_send_otp', {
      email,
    } as SendOtpRequest)
    return data
  },
  async verifyOtp(email: string, otp: string): Promise<LoginResponse> {
    const { data } = await httpClient.post<LoginResponse>('/api/auth/email_verify_otp', {
      email,
      otp,
    } as VerifyOtpRequest)

    localStorage.setItem('access_token', data.token)
    localStorage.setItem('refresh_token', data.refreshToken)

    return data
  },
}
