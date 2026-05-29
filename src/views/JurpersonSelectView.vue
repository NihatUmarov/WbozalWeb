<template>
  <MainLayout>
    <div class="jurperson-select-page-wrapper">
      <h1 class="top-title">Выбор организации</h1>

      <div v-if="isLoading" class="loading-container">
        <p>Загрузка списка организаций...</p>
      </div>

      <div v-else class="content-container">
        <div class="actions-header">
          <BaseButton
            type="button"
            :variant="showCreateForm ? 'secondary' : 'primary'"
            @click="showCreateForm = !showCreateForm"
          >
            {{ showCreateForm ? 'Отменить создание' : '➕ Добавить новую организацию' }}
          </BaseButton>
        </div>

        <BaseCard v-if="showCreateForm" width="700" class="a4-sheet create-card-spacing">
          <div class="sheet-content">
            <div class="form-section">
              <h3 class="section-subtitle">Новая организация</h3>

              <div class="two-columns">
                <BaseInput
                  v-model="newOrg.jurpersonName"
                  label="Наименование Юр. лица:*"
                  placeholder="ООО 'Компания'"
                />
                <BaseInput v-model="newOrg.inn" label="ИНН:" placeholder="1234567890" />
              </div>

              <div class="two-columns">
                <BaseInput v-model="newOrg.kpp" label="КПП:" placeholder="123456789" />
                <BaseInput
                  v-model="newOrg.email"
                  label="Email организации:"
                  placeholder="info@company.ru"
                  type="email"
                />
              </div>
            </div>

            <div class="footer-actions">
              <BaseButton :loading="isCreating" @click="handleCreateJurperson">
                Создать организацию
              </BaseButton>
            </div>
          </div>
        </BaseCard>

        <h3 class="section-subtitle list-title" v-if="jurpersons.length > 0">
          Доступные организации
        </h3>

        <div v-if="jurpersons.length > 0" class="jurpersons-grid">
          <BaseCard
            v-for="jurperson in jurpersons"
            :key="jurperson.idJurperson"
            class="jurperson-card"
            :class="{
              'selected-card': selectedId === jurperson.idJurperson,
              'loading-card': isSelecting === jurperson.idJurperson,
            }"
            @click="handleSelectJurperson(jurperson.idJurperson)"
          >
            <div class="card-body-layout">
              <div class="card-icon">🏢</div>
              <div class="card-info-text">
                <h4 class="org-name">{{ jurperson.jurpersonName }}</h4>
                <p class="inn-text">
                  {{ jurperson.inn ? `ИНН: ${jurperson.inn}` : 'ИНН: не указан' }}
                </p>
              </div>

              <div v-if="selectedId === jurperson.idJurperson" class="active-badge">Активна</div>
            </div>
          </BaseCard>
        </div>

        <div v-else-if="!showCreateForm" class="empty-state">
          <p>У вас нет доступных организаций</p>
          <p class="hint">Создайте новую организацию с помощью кнопки выше.</p>
        </div>

        <!-- Кнопка Выхода -->
        <div class="logout-wrapper">
          <hr class="divider" />
          <button class="custom-logout-btn" @click="handleLogout">Выйти из аккаунта</button>
        </div>
      </div>
    </div>
  </MainLayout>
  <TheToast ref="toastRef" />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

import MainLayout from '@/components/ui/MainLayout.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import TheToast from '@/components/ui/TheToast.vue'

import { jurpersonService } from '@/api/jurpersonService'
import type { JurpersonShort, CreateJurpersonRequest } from '@/api/types'

const router = useRouter()
const toastRef = ref<InstanceType<typeof TheToast> | null>(null)

const jurpersons = ref<JurpersonShort[]>([])
const selectedId = ref<number | null>(null)
const isLoading = ref(true)
const isSelecting = ref<number | null>(null)

// Логика создания
const showCreateForm = ref(false)
const isCreating = ref(false)
const newOrg = ref<CreateJurpersonRequest>({
  jurpersonName: '',
  inn: '',
  kpp: '',
  email: '',
})

const loadJurpersons = async () => {
  try {
    isLoading.value = true
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
}

onMounted(() => {
  loadJurpersons()
})

const handleCreateJurperson = async () => {
  if (!newOrg.value.jurpersonName.trim()) {
    toastRef.value?.show('Укажите наименование юридического лица', 'error')
    return
  }

  try {
    isCreating.value = true
    const res = await jurpersonService.createJurperson(newOrg.value)
    toastRef.value?.show(res.message || 'Организация успешно создана!', 'success')

    newOrg.value = { jurpersonName: '', inn: '', kpp: '', email: '' }
    showCreateForm.value = false

    await loadJurpersons()
  } catch (error: unknown) {
    let errorMessage = 'Ошибка при создании организации'
    if (axios.isAxiosError(error) && error.response?.data) {
      const d = error.response.data as { message?: string; details?: string }
      errorMessage = d.message || d.details || errorMessage
    }
    toastRef.value?.show(errorMessage, 'error')
  } finally {
    isCreating.value = false
  }
}

const handleSelectJurperson = async (idJurperson: number) => {
  if (isSelecting.value !== null) return
  isSelecting.value = idJurperson

  try {
    await jurpersonService.selectJurperson(idJurperson)
    selectedId.value = idJurperson
    toastRef.value?.show('Организация успешно выбрана!', 'success')

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
/* Синхронизация структуры под стиль твоего профиля */
.jurperson-select-page-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background-color: #f8fafc;
  min-height: 85vh;
}

.content-container {
  width: 100%;
  max-width: 700px; /* Выравниваем по ширине карточки профиля */
  display: flex;
  flex-direction: column;
}

.top-title {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 30px;
  text-align: center;
}

.actions-header {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 20px;
}

.create-card-spacing {
  margin-bottom: 30px;
}

.section-subtitle {
  font-size: 16px;
  font-weight: 600;
  color: #4f46e5;
  margin: 10px 0 15px;
}

.list-title {
  margin-top: 10px;
  margin-bottom: 15px;
}

.divider {
  border: 0;
  height: 1px;
  background: #e2e8f0;
  margin: 20px 0;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  font-size: 16px;
  color: #64748b;
}

.a4-sheet {
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.08) !important;
  border: 1px solid #e2e8f0 !important;
}

.sheet-content {
  display: flex;
  flex-direction: column;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.two-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.footer-actions {
  margin-top: 10px;
  display: flex;
  justify-content: center;
}

/* СЕТКА КАРТОЧЕК ВЫБОРА */
.jurpersons-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.jurperson-card {
  border: 1px solid #e2e8f0 !important;
  transition: all 0.2s ease-in-out;
  cursor: pointer;
}

.jurperson-card:hover {
  border-color: #4f46e5 !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.05) !important;
}

.selected-card {
  border-color: #4f46e5 !important;
  background-color: #f0f3ff !important;
  box-shadow: inset 0 0 0 1px #4f46e5 !important;
}

.loading-card {
  opacity: 0.6;
  cursor: not-allowed;
}

.card-body-layout {
  display: flex;
  align-items: center;
  padding: 6px 10px;
  position: relative;
  width: 100%;
}

.card-icon {
  font-size: 24px;
  margin-right: 16px;
  display: flex;
  align-items: center;
}

.card-info-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.org-name {
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
}

.inn-text {
  font-size: 13px;
  color: #64748b;
  margin: 0;
}

.active-badge {
  position: absolute;
  right: 15px;
  background-color: #e0e7ff;
  color: #4f46e5;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 12px;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #64748b;
}

.hint {
  font-size: 14px;
  color: #94a3b8;
  margin-top: 5px;
}

.logout-wrapper {
  margin-top: 30px;
  text-align: center;
}

.custom-logout-btn {
  background: none;
  border: none;
  color: #ef4444;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  padding: 8px 16px;
  transition: color 0.2s;
}

.custom-logout-btn:hover {
  color: #b91c1c;
  text-decoration: underline;
}

@media (max-width: 640px) {
  .two-columns {
    grid-template-columns: 1fr;
  }
}
</style>
