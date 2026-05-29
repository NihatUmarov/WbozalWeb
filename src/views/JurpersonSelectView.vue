<template>
  <MainLayout>
    <div class="jurperson-select-page">
      <h1 class="jurperson-select-page__title">Выбор организации</h1>

      <div v-if="isLoading" class="jurperson-select-page__loading">
        <p>Загрузка списка организаций...</p>
      </div>

      <div v-else class="jurperson-select-page__content">
        <div class="jurperson-select-page__actions">
          <BaseButton @click="toggleCreateForm">
            {{ showCreateForm ? 'Отменить создание' : 'Добавить новую организацию' }}
          </BaseButton>
        </div>

        <BaseCard v-if="showCreateForm" width="700" class="jurperson-select-page__create-card">
          <div class="create-form">
            <h3 class="section-subtitle">Новая организация</h3>

            <div class="flex-row items-end gap-5">
              <div class="flex-grow">
                <BaseInput
                  v-model="newOrg.inn"
                  label="ИНН:*"
                  placeholder="1234567890"
                  @input="handleInnInput"
                />
              </div>
              <div v-if="!isDataFetched" class="suggest-btn-wrapper">
                <BaseButton
                  :disabled="!isValidInn"
                  :loading="isSuggesting"
                  @click="handleSuggestByInn"
                >
                  Далее
                </BaseButton>
              </div>
            </div>

            <div v-if="isDataFetched" class="grid grid-cols-1 gap-5 mt-5 animated-fields">
              <BaseInput
                v-model="newOrg.jurpersonName"
                label="Сокращенное наименование (для списков):*"
                placeholder="ИП Иванов И.И. или ООО 'КОМПАНИЯ'"
              />
              <BaseInput
                v-model="newOrg.jurpersonFullName"
                label="Полное наименование организации:*"
                placeholder="Индивидуальный предприниматель Иванов Ив..."
              />

              <div class="create-form__submit">
                <BaseButton :loading="isCreating" @click="handleCreateJurperson">
                  Создать организацию
                </BaseButton>
              </div>
            </div>
          </div>
        </BaseCard>

        <h3 v-if="jurpersons.length > 0" class="section-subtitle">Доступные организации</h3>

        <div v-if="jurpersons.length > 0" class="jurpersons-list">
          <BaseCard
            v-for="jp in jurpersons"
            :key="jp.idJurperson"
            class="jurperson-card"
            :class="{
              'jurperson-card--selected': selectedId === jp.idJurperson,
              'jurperson-card--selecting': isSelecting === jp.idJurperson,
            }"
            @click="handleSelectJurperson(jp.idJurperson)"
          >
            <div class="jurperson-card__content">
              <span class="jurperson-card__icon">🏢</span>
              <div class="jurperson-card__info">
                <h4 class="jurperson-card__name">{{ jp.jurpersonName }}</h4>
                <p class="jurperson-card__inn">
                  {{ jp.inn ? `ИНН: ${jp.inn}` : 'ИНН: не указан' }}
                </p>
              </div>
              <span v-if="selectedId === jp.idJurperson" class="jurperson-card__badge">
                Активна
              </span>
            </div>
          </BaseCard>
        </div>

        <div v-else-if="!showCreateForm" class="empty-state">
          <p>У вас нет доступных организаций</p>
          <p class="empty-state__hint">Создайте новую организацию с помощью кнопки выше.</p>
        </div>

        <div class="logout-section">
          <hr class="divider" />
          <button class="logout-btn" @click="handleLogout">Выйти из аккаунта</button>
        </div>
      </div>
    </div>
    <TheToast ref="toastRef" />
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import MainLayout from '@/components/ui/MainLayout.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import TheToast from '@/components/ui/TheToast.vue'
import { jurpersonService } from '@/api/jurpersonService'
import type { JurpersonShort } from '@/api/types'

const router = useRouter()
const toastRef = ref<InstanceType<typeof TheToast> | null>(null)

// Состояние списка
const jurpersons = ref<JurpersonShort[]>([])
const selectedId = ref<number | null>(null)
const isLoading = ref(true)
const isSelecting = ref<number | null>(null)

// Состояние формы создания
const showCreateForm = ref(false)
const isSuggesting = ref(false)
const isCreating = ref(false)
const isDataFetched = ref(false) // Открывает поля ввода названий

const newOrg = ref({
  inn: '',
  jurpersonName: '',
  jurpersonFullName: '',
})

// Валидация кнопки "Далее" (ИНН в РФ бывает 10 цифр у ООО или 12 у ИП)
const isValidInn = computed(() => {
  const cleanInn = newOrg.value.inn.trim()
  return cleanInn.length === 10 || cleanInn.length === 12
})

// Сброс и открытие формы
const toggleCreateForm = () => {
  showCreateForm.value = !showCreateForm.value
  if (!showCreateForm.value) {
    resetCreateForm()
  }
}

const resetCreateForm = () => {
  newOrg.value = { inn: '', jurpersonName: '', jurpersonFullName: '' }
  isDataFetched.value = false
}

// Если пользователь изменил ИНН, сбрасываем состояние "Далее" (тухнет создание)
const handleInnInput = () => {
  if (isDataFetched.value) {
    isDataFetched.value = false
    newOrg.value.jurpersonName = ''
    newOrg.value.jurpersonFullName = ''
  }
}

// Шаг 1: Запрос подсказки по ИНН
const handleSuggestByInn = async () => {
  if (!isValidInn.value) return

  try {
    isSuggesting.value = true
    const data = await jurpersonService.suggestByInn(newOrg.value.inn.trim())

    newOrg.value.jurpersonName = data.jurpersonName || ''
    newOrg.value.jurpersonFullName = data.jurpersonFullName || ''

    toastRef.value?.show('Данные по ИНН успешно найдены!', 'success')
  } catch {
    toastRef.value?.show('Контрагент не найден или сбой сети. Введите названия вручную.', 'warning')
  } finally {
    isSuggesting.value = false
    isDataFetched.value = true
  }
}

const handleCreateJurperson = async () => {
  if (!newOrg.value.jurpersonName.trim()) {
    toastRef.value?.show('Укажите сокращенное наименование', 'error')
    return
  }
  if (!newOrg.value.jurpersonFullName.trim()) {
    toastRef.value?.show('Укажите полное наименование', 'error')
    return
  }

  try {
    isCreating.value = true
    const res = await jurpersonService.createJurperson({
      inn: newOrg.value.inn.trim(),
      jurpersonName: newOrg.value.jurpersonName.trim(),
      jurpersonFullName: newOrg.value.jurpersonFullName.trim(),
    })

    toastRef.value?.show(res.message || 'Организация успешно создана!', 'success')

    resetCreateForm()
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

// Загрузка списка организаций
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

onMounted(loadJurpersons)

// Выбор организации
const handleSelectJurperson = async (id: number) => {
  if (isSelecting.value !== null) return
  isSelecting.value = id

  try {
    await jurpersonService.selectJurperson(id)
    selectedId.value = id
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
.jurperson-select-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--spacing-20);
  background-color: var(--color-background);
  min-height: 85vh;
}

.jurperson-select-page__title {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-32);
  letter-spacing: var(--letter-spacing-tight);
}

.jurperson-select-page__loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  font-size: var(--font-size-lg);
  color: var(--color-text-secondary);
}

.jurperson-select-page__content {
  width: 100%;
  max-width: 700px;
  display: flex;
  flex-direction: column;
}

.jurperson-select-page__actions {
  display: flex;
  justify-content: flex-start;
  margin-bottom: var(--spacing-20);
}

.jurperson-select-page__create-card {
  margin-bottom: var(--spacing-32);
}

.create-form {
  display: flex;
  flex-direction: column;
  padding: var(--spacing-8);
}

.flex-row {
  display: flex;
  align-items: flex-end;
  width: 100%;
}

.flex-grow {
  flex-grow: 1;
}

.suggest-btn-wrapper {
  margin-bottom: 2px; /* Выравнивание под высоту инпута с учетом лейбла */
}

.create-form__submit {
  margin-top: var(--spacing-16);
  display: flex;
  justify-content: center;
}

.animated-fields {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Список организаций */
.jurpersons-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-12);
  width: 100%;
}

.jurperson-card {
  border: 1px solid var(--color-border) !important;
  transition: all var(--transition-base) !important;
  cursor: pointer;
  padding: var(--spacing-4) !important;
}

.jurperson-card:hover {
  border-color: var(--color-primary) !important;
  transform: translateY(-2px);
  box-shadow: var(--shadow-md) !important;
}

.jurperson-card--selected {
  border-color: var(--color-primary) !important;
  background-color: var(--color-primary-subtle) !important;
  box-shadow: inset 0 0 0 1px var(--color-primary) !important;
}

.jurperson-card__content {
  display: flex;
  align-items: center;
  padding: var(--spacing-2) var(--spacing-3);
}

.jurperson-card__icon {
  font-size: var(--font-size-2xl);
  margin-right: var(--spacing-16);
}

.jurperson-card__info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.jurperson-card__name {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
}

.jurperson-card__inn {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: 0;
}

.jurperson-card__badge {
  background-color: var(--color-primary-subtle);
  color: var(--color-primary);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  padding: var(--spacing-4) var(--spacing-10);
  border-radius: var(--border-radius-full);
}

/* Пустое состояние */
.empty-state {
  text-align: center;
  padding: var(--spacing-40) var(--spacing-20);
  color: var(--color-text-secondary);
}

.empty-state__hint {
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
  margin-top: var(--spacing-5);
}

/* Выход */
.logout-section {
  margin-top: var(--spacing-32);
  text-align: center;
}

.divider {
  border: 0;
  height: 1px;
  background: var(--color-border);
  margin: var(--spacing-20) 0;
}

.logout-btn {
  background: none;
  border: none;
  color: var(--color-error-text);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  padding: var(--spacing-8) var(--spacing-16);
  transition: color var(--transition-fast);
}

.logout-btn:hover {
  color: var(--color-error);
  text-decoration: underline;
}

.section-subtitle {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
  margin: var(--spacing-10) 0 var(--spacing-5);
}

@media (max-width: 640px) {
  .jurperson-select-page {
    padding: var(--spacing-16);
  }
  .flex-row {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
}
</style>
