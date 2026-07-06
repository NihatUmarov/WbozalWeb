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
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from '@/composables/useToast'
import { authService } from '../api/authService'
import { useAsync } from '@/composables/useAsync'

import telegramIcon from '@/components/icons/telegram.svg'
import whatsappIcon from '@/components/icons/whatsapp.svg'
import supportIcon from '@/components/icons/max.svg'

const router = useRouter()
const toast = useToast()
const step = ref<number>(1)
const email = ref<string>('')
const otp = ref<string[]>(['', '', '', '', '', ''])
const otpInputs = ref<HTMLInputElement[]>([])

const { loading, run } = useAsync()
const isOtpComplete = computed<boolean>(() => otp.value.every((v) => v.length === 1))

const socialLinks = [
  { title: 'Telegram', url: 'https://t.me/managerwbozal', icon: telegramIcon },
  { title: 'WhatsApp', url: 'https://wa.me/message/4AASDN7XCFH3M1', icon: whatsappIcon },
  {
    title: 'Support',
    url: 'https://max.ru/u/f9LHodD0cOKODq-bFKJhcSQRZs7YbT95mHmBGqvzE2N5D4eCQYBDay8jP_8',
    icon: supportIcon,
  },
]

const handleSendOtp = (): void => {
  if (!email.value.trim()) return toast.warning('Пожалуйста, введите email')
  run(
    async () => {
      await authService.sendOtp(email.value.trim())
      step.value = 2
      otp.value = ['', '', '', '', '', '']
      nextTick(() => otpInputs.value[0]?.focus())
    },
    { toast },
  )
}

const handleLogin = (): void => {
  const finalCode = otp.value.join('')
  if (finalCode.length < 6) return
  run(
    async () => {
      await authService.verifyOtp(email.value.trim(), finalCode)
      toast.success('Успешный вход!')
      router.push('/')
    },
    { toast },
  )
}

const handleOtpInput = (e: Event, index: number): void => {
  const val = (e.target as HTMLInputElement).value
  if (!/^\d*$/.test(val)) {
    otp.value[index] = ''
    return
  }

  if (val && index < 5) {
    otpInputs.value[index + 1].focus()
  }

  if (isOtpComplete.value) {
    handleLogin()
  }
}

const handleOtpKeyDown = (e: KeyboardEvent, index: number): void => {
  if (e.key === 'Backspace' && !otp.value[index] && index > 0) {
    otp.value[index - 1] = ''
    otpInputs.value[index - 1].focus()
  }
}

const handleOtpPaste = (e: ClipboardEvent): void => {
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
