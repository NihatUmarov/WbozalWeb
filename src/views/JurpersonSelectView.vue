<template>
  <div class="jurperson-select-page">
    <div class="select-container">
      <div class="header-section">
        <h1>Выберите организацию</h1>
        <p>Для продолжения работы необходимо выбрать одну из ваших организаций</p>
      </div>

      <div v-if="isLoading" class="loading-state">
        <p>Загрузка организаций...</p>
      </div>

      <div v-else-if="jurpersons.length > 0" class="jurpersons-grid">
        <div
          v-for="jurperson in jurpersons"
          :key="jurperson.idJurperson"
          class="jurperson-card"
          :class="{
            selected: selectedId === jurperson.idJurperson,
            loading: isSelecting === jurperson.idJurperson,
          }"
          @click="handleSelectJurperson(jurperson.idJurperson)"
        >
          <div class="card-icon">🏢</div>
          <div class="card-content">
            <h3>{{ jurperson.jurpersonName }}</h3>
            <p class="inn-text" v-if="jurperson.inn">ИНН: {{ jurperson.inn }}</p>
            <p class="inn-text" v-else>ИНН: не указан</p>
          </div>
          <div v-if="isSelecting === jurperson.idJurperson" class="loading-spinner">
            <span></span>
          </div>
        </div>
      </div>
      <div v-else class="empty-state">
        <p>У вас нет доступных организаций</p>
        <p class="hint">
          Пожалуйста, обратитесь к администратору для добавления доступа к организации
        </p>
      </div>

      <div class="footer-section">
        <button class="logout-btn" @click="handleLogout">Выход</button>
      </div>
    </div>

    <TheToast ref="toastRef" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import TheToast from '@/components/ui/TheToast.vue'
import { jurpersonService } from '@/api/jurpersonService'
import { authService } from '@/api/authService'

import type { JurpersonShort } from '@/api/types'

const router = useRouter()
const toastRef = ref<InstanceType<typeof TheToast> | null>(null)

const jurpersons = ref<JurpersonShort[]>([])
const selectedId = ref<number | null>(null)
const isLoading = ref(true)
const isSelecting = ref<number | null>(null)

onMounted(async () => {
  try {
    const data = await jurpersonService.getJurpersons()
    jurpersons.value = data.jurpersons
    selectedId.value = data.activeId
  } catch (error: unknown) {
    let errorMessage = 'Ошибка при загрузке организаций'
    if (axios.isAxiosError(error) && error.response?.data) {
      const d = error.response.data as { msg?: string; message?: string }
      errorMessage = d.msg || d.message || errorMessage
    }
    toastRef.value?.show(errorMessage, 'error')
  } finally {
    isLoading.value = false
  }
})

const handleSelectJurperson = async (idJurperson: number) => {
  if (isSelecting.value !== null) return

  isSelecting.value = idJurperson

  try {
    // ИСПРАВЛЕНО: Вызываем новый метод switchProfile из authService вместо selectJurperson
    await authService.switchProfile(idJurperson)

    selectedId.value = idJurperson
    toastRef.value?.show('Организация успешно выбрана!', 'success')

    // Перенаправляем на главную страницу через 500ms
    setTimeout(() => {
      router.push('/')
    }, 500)
  } catch (error: unknown) {
    let errorMessage = 'Ошибка при выборе организации'
    if (axios.isAxiosError(error) && error.response?.data) {
      const d = error.response.data as { msg?: string; message?: string }
      errorMessage = d.msg || d.message || errorMessage
    }
    toastRef.value?.show(errorMessage, 'error')
  } finally {
    isSelecting.value = null
  }
}

const handleLogout = () => {
  localStorage.clear()
  window.location.href = '/login'
}
</script>

<style scoped>
.jurperson-select-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
}

.select-container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 900px;
  width: 100%;
  padding: 40px;
}

.header-section {
  text-align: center;
  margin-bottom: 40px;
}

.header-section h1 {
  font-size: 32px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 12px;
}

.header-section p {
  font-size: 16px;
  color: #64748b;
}

.loading-state {
  text-align: center;
  padding: 60px 20px;
  color: #64748b;
  font-size: 16px;
}

.jurpersons-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.jurperson-card {
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  position: relative;
}

.jurperson-card:hover:not(.loading) {
  border-color: #667eea;
  background: #f0f3ff;
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.1);
  transform: translateY(-4px);
}

.jurperson-card.selected {
  border-color: #667eea;
  background: #f0f3ff;
  box-shadow: inset 0 0 0 2px #667eea;
}

.jurperson-card.loading {
  opacity: 0.6;
  cursor: not-allowed;
}

.card-icon {
  font-size: 40px;
  margin-bottom: 12px;
}

.card-content {
  width: 100%;
}

.card-content h3 {
  font-size: 18px;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 8px 0;
  word-break: break-word;
}

.inn-text {
  font-size: 13px;
  color: #64748b;
  margin: 0;
}

.loading-spinner {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.loading-spinner span {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid #e2e8f0;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #64748b;
}

.empty-state p {
  margin: 0 0 12px 0;
  font-size: 16px;
}

.hint {
  font-size: 14px;
  color: #94a3b8;
}

.footer-section {
  display: flex;
  justify-content: center;
  gap: 12px;
  padding-top: 20px;
  border-top: 1px solid #e2e8f0;
}

.logout-btn {
  padding: 10px 24px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;
}

.logout-btn:hover {
  background: #dc2626;
}
</style>
