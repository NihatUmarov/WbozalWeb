<template>
  <div id="app">
    <router-view />

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

interface VersionResponse {
  version: string
}

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

.update-icon {
  font-size: 18px;
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

/* Анимация появления плашки */
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
