<template>
  <div class="auth-page">
    <div class="auth-wrapper">
      <div class="auth-sidebar">
        <div class="sidebar-content">
          <div class="sidebar-logo">
            <h1 class="logo-text">W<span class="accent">b</span>ozal</h1>
            <div class="logo-line"></div>
          </div>

          <div class="sidebar-info">
            <h3>Умное управление складом</h3>
            <p>
              Эффективность в каждом движении.<br />
              Можете на нас положиться!
            </p>
          </div>
        </div>
        <SocialLinks />
      </div>

      <div class="auth-form-container">
        <Transition name="fade" mode="out-in">
          <!-- ШАГ 1: ПОЧТА -->
          <div v-if="step === 1" key="email" class="step-box">
            <div class="form-header">
              <h2>Вход</h2>
              <p>Введите почту для доступа в систему</p>
            </div>

            <BaseInput
              v-model="email"
              label="Электронная почта"
              placeholder="name@company.com"
              type="email"
              class="mb-6"
            />

            <BaseButton :loading="loading" @click="handleSendOtp"> Продолжить </BaseButton>
          </div>

          <div v-else key="otp" class="step-box">
            <button class="back-link" @click="step = 1">
              <span class="arrow">←</span> Назад к почте
            </button>

            <div class="form-header">
              <h2>Код доступа</h2>
              <p>
                Мы отправили его на <strong>{{ email }}</strong>
              </p>
            </div>

            <!-- СЕТКА OTP ИНПУТОВ -->
            <div class="otp-container">
              <input
                v-for="(digit, index) in otp"
                :key="index"
                ref="otpInputs"
                v-model="otp[index]"
                type="text"
                maxlength="1"
                inputmode="numeric"
                autocomplete="one-time-code"
                class="otp-input"
                :class="{ filled: otp[index] }"
                @input="handleOtpInput($event, index)"
                @keydown="handleOtpKeyDown($event, index)"
                @paste="handleOtpPaste"
              />
            </div>

            <BaseButton :loading="loading" :disabled="!isOtpComplete" @click="handleLogin">
              Войти в систему
            </BaseButton>

            <p class="resend-text">
              Не получили код? <button class="resend-btn">Отправить повторно</button>
            </p>
          </div>
        </Transition>
      </div>
    </div>
  </div>
  <TheToast ref="toastRef" />
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import TheToast from '@/components/ui/TheToast.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import SocialLinks from '@/components/ui/SocialLinks.vue'

import { authService } from '../api/authService'

const router = useRouter()
const toastRef = ref<InstanceType<typeof TheToast> | null>(null)
const step = ref(1)
const email = ref('')
const loading = ref(false)

// OTP Логика
const otp = ref(['', '', '', '', '', ''])
const otpInputs = ref<HTMLInputElement[]>([])

const isOtpComplete = computed(() => otp.value.every((v) => v.length === 1))

// 1. Отправка OTP на почту
const handleSendOtp = async () => {
  if (!email.value) {
    toastRef.value?.show('Пожалуйста, введите email')
    return
  }

  loading.value = true

  try {
    await authService.sendOtp(email.value)
    step.value = 2
    nextTick(() => otpInputs.value[0]?.focus())
  } catch (error: unknown) {
    let errorMessage = 'Ошибка при отправке кода. Попробуйте позже.'

    // Безопасное извлечение ошибки без использования any
    if (axios.isAxiosError(error) && error.response?.data) {
      const data = error.response.data as { message?: string }
      if (data.message) errorMessage = data.message
    }

    toastRef.value?.show(errorMessage)
  } finally {
    loading.value = false
  }
}

// 2. Проверка OTP и Вход в систему
const handleLogin = async () => {
  const finalCode = otp.value.join('')
  if (finalCode.length < 6) return

  loading.value = true

  try {
    await authService.verifyOtp(email.value, finalCode)
    toastRef.value?.show('Успешный вход!')
    router.push('/')
  } catch (error: unknown) {
    let errorMessage = 'Неверный код или ошибка сервера'

    if (axios.isAxiosError(error) && error.response?.data) {
      const data = error.response.data as { message?: string }
      if (data.message) errorMessage = data.message
    }

    toastRef.value?.show(errorMessage)
  } finally {
    loading.value = false
  }
}

// Логика управления инпутами
const handleOtpInput = (e: Event, index: number) => {
  const input = e.target as HTMLInputElement
  const val = input.value

  if (!/^\d*$/.test(val)) {
    otp.value[index] = ''
    return
  }

  if (val && index < 5) {
    otpInputs.value[index + 1].focus()
  }
}

const handleOtpKeyDown = (e: KeyboardEvent, index: number) => {
  if (e.key === 'Backspace' && !otp.value[index] && index > 0) {
    otpInputs.value[index - 1].focus()
  }
}

const handleOtpPaste = (e: ClipboardEvent) => {
  e.preventDefault()
  const pastedData = e.clipboardData?.getData('text').slice(0, 6) || ''
  if (!/^\d+$/.test(pastedData)) return

  const digits = pastedData.split('')
  digits.forEach((d, i) => {
    if (i < 6) otp.value[i] = d
  })

  const nextIndex = Math.min(digits.length, 5)
  otpInputs.value[nextIndex].focus()
}
</script>

<style scoped>
.auth-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f1f5f9;
  padding: 20px;
  font-family:
    'Inter',
    system-ui,
    -apple-system,
    sans-serif;
}

.svg-icon {
  width: 40px;
  height: 40px;
  object-fit: contain;
}

.auth-wrapper {
  display: flex;
  width: 100%;
  max-width: 1000px;
  min-height: 600px;
  background: white;
  border-radius: 32px;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.15);
}

/* SIDEBAR */
.auth-sidebar {
  flex: 1;
  background: #0f172a;
  padding: 60px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: white;
  position: relative;
}

.logo-text {
  font-size: 42px;
  font-weight: 800;
  letter-spacing: -1.5px;
  margin: 0;
}

.logo-text .accent {
  color: #6366f1;
}

.logo-line {
  width: 44px;
  height: 5px;
  background: #6366f1;
  margin-top: 8px;
  border-radius: 10px;
}

.sidebar-info {
  margin-top: 60px;
}
.sidebar-info h3 {
  font-size: 24px;
  margin-bottom: 16px;
  font-weight: 700;
}
.sidebar-info p {
  font-size: 16px;
  line-height: 1.6;
  color: #94a3b8;
}

.social-links {
  display: flex;
  gap: 12px;
}
.social-icon {
  width: 42px;
  height: 42px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: 0.3s;
  text-decoration: none;
  color: white;
  font-size: 12px;
  font-weight: bold;
  border: 1px solid rgba(255, 255, 255, 0.1);
}
.social-icon:hover {
  background: #6366f1;
  border-color: #6366f1;
  transform: translateY(-2px);
}

/* FORM AREA */
.auth-form-container {
  flex: 1.3;
  padding: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.step-box {
  width: 100%;
  max-width: 400px;
}

.form-header {
  margin-bottom: 40px;
}
.form-header h2 {
  font-size: 36px;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 12px;
}
.form-header p {
  color: #64748b;
  font-size: 16px;
}

/* OTP GRID */
.otp-container {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 10px;
  margin-bottom: 32px;
}

.otp-input {
  width: 100%;
  height: 60px;
  text-align: center;
  font-size: 24px;
  font-weight: 700;
  border: 2px solid #e2e8f0;
  border-radius: 14px;
  background: #f8fafc;
  transition: all 0.2s;
  color: #0f172a;
}

.otp-input:focus {
  outline: none;
  border-color: #6366f1;
  background: white;
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
}

.otp-input.filled {
  border-color: #cbd5e1;
  background: white;
}

.back-link {
  background: none;
  border: none;
  color: #6366f1;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 30px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0;
}

.resend-text {
  text-align: center;
  margin-top: 24px;
  font-size: 14px;
  color: #64748b;
}

.resend-btn {
  background: none;
  border: none;
  color: #6366f1;
  font-weight: 600;
  cursor: pointer;
}

.mb-6 {
  margin-bottom: 24px;
}

/* ANIMATION */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease-out;
}
.fade-enter-from {
  opacity: 0;
  transform: translateX(20px);
}
.fade-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

@media (max-width: 850px) {
  .auth-wrapper {
    flex-direction: column;
    max-width: 500px;
  }
  .auth-sidebar {
    padding: 40px;
  }
  .auth-form-container {
    padding: 40px;
  }
  .otp-input {
    height: 50px;
    font-size: 20px;
  }
}
</style>
