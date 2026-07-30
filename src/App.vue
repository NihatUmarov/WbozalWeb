<template>
  <div id="app" class="app-container">
    <BaseHeader v-if="$route.meta.requiresJurperson" />

    <main class="main-content">
      <router-view />
    </main>

    <!-- Глобальные уведомления (Toasts) -->
    <Teleport to="body">
      <TransitionGroup name="toast-fade" tag="div" class="toast-list">
        <div v-for="toast in toasts" :key="toast.id" class="toast-card glass-effect">
          <span :class="['toast-icon', `toast-icon--${toast.type}`]">{{ toast.icon }}</span>
          <p class="toast-msg">{{ toast.message }}</p>
        </div>
      </TransitionGroup>
    </Teleport>

    <transition name="fade">
      <div v-if="updateAvailable" class="update-notification">
        <div class="update-content">
          <p>Доступно критическое обновление системы!</p>
        </div>
        <button @click="forceReload" class="update-btn">Обновить сейчас</button>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import BaseHeader from '@/components/ui/BaseHeader.vue'
import { useToast } from '@/composables/useToast'

interface VersionResponse {
  version: string
}

const { toasts } = useToast()
const currentVersion = ref<string | null>(null)
const updateAvailable = ref<boolean>(false)
let checkInterval: ReturnType<typeof setInterval> | null = null

const checkVersion = async (): Promise<void> => {
  try {
    const response = await fetch(`/version.json?t=${Date.now()}`, {
      cache: 'no-store',
    })
    if (!response.ok) return

    const data: VersionResponse = await response.json()

    if (!currentVersion.value) {
      currentVersion.value = data.version
    } else if (data.version !== currentVersion.value) {
      updateAvailable.value = true
    }
  } catch (error) {
    console.error('Ошибка проверки обновления:', error)
  }
}

const forceReload = async (): Promise<void> => {
  try {
    if ('caches' in window) {
      const cacheNames = await caches.keys()
      await Promise.all(cacheNames.map((name) => caches.delete(name)))
    }

    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations()
      for (const registration of registrations) {
        await registration.unregister()
      }
    }
  } catch (e) {
    console.error('Не удалось полностью очистить кэш:', e)
  }
  window.location.reload()
}

onMounted(() => {
  checkVersion()
  checkInterval = setInterval(checkVersion, 10000)
})

onBeforeUnmount(() => {
  if (checkInterval) clearInterval(checkInterval)
})
</script>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

/* Контейнер для контента страниц */
.main-content {
  flex: 1;
  width: 100%;
  padding: 80px 2.5% 0px 2.5%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.app-container :deep(.main-header[style*='position: fixed']) + .main-content,
.app-container :deep(.main-header.is-fixed) + .main-content {
  margin-top: 85px !important;
}

.update-notification {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  background: #2c3e50;
  color: #fff;
  padding: 12px 24px;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  gap: 20px;
  font-family: sans-serif;
  border: 1px solid #42b983;
}

.update-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.update-content p {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
}

.update-btn {
  background: #42b983;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  font-size: 13px;
  transition: background 0.2s;
}

.update-btn:hover {
  background: #35495e;
  border: 1px solid #42b983;
}

.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.5s,
    transform 0.5s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translate(-50%, -30px);
}
</style>
