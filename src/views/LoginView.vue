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
            <p>Эффективность в каждом движении.<br />Можете на нас положиться!</p>
          </div>
        </div>

        <div class="social-links-block">
          <a
            v-for="link in socialLinks"
            :key="link.title"
            :href="link.url"
            class="social-icon-btn"
            :title="link.title"
            target="_blank"
          >
            <img :src="link.icon" :alt="link.title" class="svg-icon-img" />
          </a>
        </div>
      </div>

      <div class="auth-form-container">
        <Transition name="fade" mode="out-in">
          <div v-if="step === 1" key="email" class="step-box flex flex-col gap-20">
            <div class="form-header">
              <h2>Вход</h2>
              <p class="text-muted">Введите почту для доступа в систему</p>
            </div>

            <div class="input-group">
              <label class="input-label">Электронная почта</label>
              <input
                v-model="email"
                type="email"
                placeholder="name@company.com"
                class="input"
                @keydown.enter="email.trim() && handleSendOtp()"
              />
            </div>

            <button
              class="btn btn-primary"
              :disabled="loading || !email.trim()"
              @click="handleSendOtp"
            >
              <span v-if="loading" class="btn-spinner"></span>
              <span v-else>Продолжить</span>
            </button>
          </div>

          <div v-else key="otp" class="step-box flex flex-col gap-20">
            <button class="back-link-btn" @click="step = 1"><span>←</span> Назад к почте</button>
            <div class="form-header">
              <h2>Код доступа</h2>
              <p class="text-muted">
                Мы отправили его на <strong>{{ email }}</strong>
              </p>
            </div>

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
                class="otp-field"
                :class="{ filled: otp[index] }"
                @input="handleOtpInput($event, index)"
                @keydown="handleOtpKeyDown($event, index)"
                @paste="handleOtpPaste"
              />
            </div>

            <button
              class="btn btn-primary"
              :disabled="loading || !isOtpComplete"
              @click="handleLogin"
            >
              <span v-if="loading" class="btn-spinner"></span>
              <span v-else>Войти в систему</span>
            </button>

            <p class="resend-text text-sm">
              Не получили код?
              <button class="resend-btn" :disabled="loading" @click="handleSendOtp">
                Отправить повторно
              </button>
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
import TheToast from '@/components/ui/TheToast.vue'
import { authService } from '../api/authService'
import { useAsync } from '@/composables/useAsync'

import telegramIcon from '@/components/icons/telegram.svg'
import whatsappIcon from '@/components/icons/whatsapp.svg'
import supportIcon from '@/components/icons/max.svg'

const router = useRouter()
const toastRef = ref<InstanceType<typeof TheToast> | null>(null)
const step = ref(1)
const email = ref('')
const otp = ref(['', '', '', '', '', ''])
const otpInputs = ref<HTMLInputElement[]>([])

const { loading, run } = useAsync()
const isOtpComplete = computed(() => otp.value.every((v) => v.length === 1))

const socialLinks = [
  { title: 'Telegram', url: 'https://t.me/managerwbozal', icon: telegramIcon },
  { title: 'WhatsApp', url: 'https://wa.me/your_number', icon: whatsappIcon },
  { title: 'Support', url: '#', icon: supportIcon },
]

const handleSendOtp = () => {
  if (!email.value.trim()) return toastRef.value?.show('Пожалуйста, введите email', 'warning')
  run(
    async () => {
      await authService.sendOtp(email.value.trim())
      step.value = 2
      // Очищаем старый код при повторном/новом запросе
      otp.value = ['', '', '', '', '', '']
      nextTick(() => otpInputs.value[0]?.focus())
    },
    { toast: toastRef.value },
  )
}

const handleLogin = () => {
  const finalCode = otp.value.join('')
  if (finalCode.length < 6) return
  run(
    async () => {
      await authService.verifyOtp(email.value.trim(), finalCode)
      toastRef.value?.show('Успешный вход!', 'success')
      router.push('/')
    },
    { toast: toastRef.value },
  )
}

const handleOtpInput = (e: Event, index: number) => {
  const val = (e.target as HTMLInputElement).value
  if (!/^\d*$/.test(val)) return (otp.value[index] = '')

  if (val && index < 5) {
    otpInputs.value[index + 1].focus()
  }

  // Автоматический сабмит, если ввели последнюю цифру и код собран
  if (isOtpComplete.value) {
    handleLogin()
  }
}

const handleOtpKeyDown = (e: KeyboardEvent, index: number) => {
  if (e.key === 'Backspace' && !otp.value[index] && index > 0) {
    otp.value[index - 1] = ''
    otpInputs.value[index - 1].focus()
  }
}

const handleOtpPaste = (e: ClipboardEvent) => {
  e.preventDefault()
  const pastedData = e.clipboardData?.getData('text').slice(0, 6).trim() || ''
  if (!/^\d+$/.test(pastedData)) return

  pastedData.split('').forEach((digit, i) => {
    if (i < 6) otp.value[i] = digit
  })

  const targetIndex = Math.min(pastedData.length, 5)
  otpInputs.value[targetIndex].focus()

  if (isOtpComplete.value) {
    handleLogin()
  }
}
</script>

<style scoped>
.auth-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: var(--spacing-24);
}
.auth-wrapper {
  display: flex;
  width: 100%;
  max-width: 1000px;
  min-height: 600px;
  border-radius: var(--radius-12);
  overflow: hidden;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--color-border);
}
.auth-sidebar {
  flex: 1;
  background: #0f172a;
  padding: 60px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: white;
}
.logo-text {
  font-size: 42px;
  font-weight: 800;
  letter-spacing: -1.5px;
  margin: 0;
  color: #fff;
}
.logo-text .accent {
  color: var(--color-primary);
}
.logo-line {
  width: 44px;
  height: 5px;
  background: var(--color-primary);
  margin-top: 8px;
  border-radius: var(--radius-full);
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

.social-links-block {
  display: flex;
  gap: var(--spacing-12);
}
.social-icon-btn {
  width: 44px;
  height: 44px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-12);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all var(--transition-base);
}
.social-icon-btn:hover {
  background: var(--color-primary);
  transform: translateY(-2px);
}
.svg-icon-img {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.auth-form-container {
  flex: 1.3;
  padding: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-surface);
}
.step-box {
  width: 100%;
  max-width: 400px;
}
.form-header h2 {
  font-size: 36px;
  font-weight: 800;
  margin-bottom: 12px;
}

.otp-container {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: var(--spacing-12);
}
.otp-field {
  width: 100%;
  height: 60px;
  text-align: center;
  font-size: 24px;
  font-weight: 700;
  border: 1px solid var(--color-border-dark);
  border-radius: var(--radius-12);
  background: var(--color-background-secondary);
  color: var(--color-text-primary);
  transition: all var(--transition-fast);
  outline: none;
}
.otp-field:focus {
  border-color: var(--color-primary);
  background: var(--color-surface);
  box-shadow: 0 0 0 4px var(--color-primary-subtle);
}
.otp-field.filled {
  border-color: var(--color-text-tertiary);
  background: var(--color-surface);
}

.back-link-btn {
  background: none;
  border: none;
  color: var(--color-primary);
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  width: fit-content;
  padding: 0 0 var(--spacing-8) 0;
}
.resend-text {
  text-align: center;
  color: var(--color-text-secondary);
  margin-top: var(--spacing-4);
}
.resend-btn {
  background: none;
  border: none;
  color: var(--color-primary);
  font-weight: 600;
  cursor: pointer;
}
.resend-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.fade-enter-active,
.fade-leave-active {
  transition: all var(--transition-fast);
}
.fade-enter-from {
  opacity: 0;
  transform: translateX(10px);
}
.fade-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}

@media (max-width: 850px) {
  .auth-wrapper {
    flex-direction: column;
    max-width: 500px;
    min-height: auto;
  }
  .auth-sidebar,
  .auth-form-container {
    padding: 40px;
  }
  .otp-field {
    height: 50px;
    font-size: 20px;
  }
}
</style>
