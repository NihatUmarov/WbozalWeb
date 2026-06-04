import httpClient from './httpClient'
import type {
  SendOtpRequest,
  SendOtpResponse,
  VerifyOtpRequest,
  LoginResponse,
  SwitchProfileResponse,
} from './types'

export const authService = {
  async sendOtp(email: string): Promise<SendOtpResponse> {
    const { data } = await httpClient.post<SendOtpResponse>('/api/auth/email_send_otp', {
      em: email,
    } as SendOtpRequest)
    return data
  },

  async verifyOtp(email: string, otp: string): Promise<LoginResponse> {
    const { data } = await httpClient.post<LoginResponse>('/api/auth/email_verify_otp', {
      em: email,
      otp,
    } as VerifyOtpRequest)

    localStorage.setItem('access_token', data.tok)
    localStorage.setItem('refresh_token', data.rf_tok)
    localStorage.setItem('user_role', data.role)

    return data
  },

  async switchProfile(jid: number | null): Promise<SwitchProfileResponse> {
    const { data } = await httpClient.post<SwitchProfileResponse>('/api/auth/switch_profile', {
      jid,
    })

    if (data.tok && data.rf_tok) {
      localStorage.setItem('access_token', data.tok)
      localStorage.setItem('refresh_token', data.rf_tok)
    }

    return data
  },
}
