import axios, { AxiosError } from 'axios'
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import type { RefreshTokenResponse } from './types'

const BASE_URL = 'https://api.wbozal.ru' //'http://localhost:5123'

const httpClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

let isRefreshing = false
let failedQueue: Array<{
  resolve: (value: string | null) => void
  reject: (error: AxiosError) => void
}> = []

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

export const getSelectedJurpersonId = (): string | null => {
  return localStorage.getItem('selected_jurperson_id')
}

httpClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }

    const jurpersonId = getSelectedJurpersonId()
    if (jurpersonId && config.headers) {
      config.headers['X-Jurperson-Id'] = jurpersonId
    }

    return config
  },
  (error) => Promise.reject(error),
)

export default httpClient

httpClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (!error.response || error.response.status !== 401) {
      return Promise.reject(error)
    }

    if (originalRequest.url?.includes('/api/auth/refresh')) {
      handleLogout()
      return Promise.reject(error)
    }

    if (originalRequest._retry) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      })
        .then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`
          }
          return httpClient(originalRequest)
        })
        .catch((err) => Promise.reject(err))
    }

    originalRequest._retry = true
    isRefreshing = true

    const accessToken = localStorage.getItem('access_token') || ''
    const refreshToken = localStorage.getItem('refresh_token') || ''

    return new Promise((resolve, reject) => {
      axios
        .post<RefreshTokenResponse>(`${BASE_URL}/api/auth/refresh`, {
          t_tok: accessToken,
          rf_tok: refreshToken,
        })
        .then(({ data }) => {
          localStorage.setItem('access_token', data.tok)
          localStorage.setItem('refresh_token', data.rf_tok)
          localStorage.setItem('user_role', data.role)

          processQueue(null, data.tok)

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${data.tok}`
          }
          resolve(httpClient(originalRequest))
        })
        .catch((err) => {
          processQueue(err, null)
          handleLogout()
          reject(err)
        })
        .finally(() => {
          isRefreshing = false
        })
    })
  },
)

function handleLogout() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('user_role')
  localStorage.removeItem('selected_jurperson_id')
  window.location.href = '/login'
}
