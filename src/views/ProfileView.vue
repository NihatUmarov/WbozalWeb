<template>
  <MainLayout>
    <div class="w-full max-w-4xl mx-auto py-6 px-4 flex flex-col gap-20">
      <div class="card page-header">
        <h1>Профиль организации</h1>
      </div>

      <div
        v-if="loading"
        class="card text-center py-40 text-muted flex flex-col items-center justify-center gap-12"
      >
        <div class="table-spinner"></div>
        <p class="text-sm font-medium">Загрузка данных организации...</p>
      </div>

      <form v-else @submit.prevent class="card flex flex-col gap-24">
        <div class="flex flex-col gap-20">
          <div class="flex items-center gap-12 pb-12 border-line">
            <Building2 class="icon-header" />
            <h2 class="profile-section-title">Юридические данные</h2>
          </div>

          <div class="form-grid-2">
            <div class="input-group">
              <label class="input-label">Наименование Юр. лица (для списков)*</label>
              <input
                v-model="userData.jurpersonName"
                type="text"
                placeholder="ООО 'Компания'"
                class="input"
              />
            </div>
            <div class="input-group">
              <label class="input-label">ИНН*</label>
              <input v-model="userData.inn" type="text" placeholder="123456789012" class="input" />
            </div>
            <div class="input-group">
              <label class="input-label">Полное наименование организации*</label>
              <input
                v-model="userData.jurpersonFullName"
                type="text"
                placeholder="Общество с ограниченной ответственностью..."
                class="input"
              />
            </div>
            <div class="input-group">
              <label class="input-label">КПП</label>
              <input v-model="userData.kpp" type="text" placeholder="123456789" class="input" />
            </div>
            <div class="input-group">
              <label class="input-label">Номер договора со складом</label>
              <input v-model="userData.agreeNum" type="text" placeholder="ДГ-12345" class="input" />
            </div>
          </div>
        </div>

        <div class="flex flex-col gap-20 section-divider">
          <div class="flex items-center gap-12 pb-12 border-line">
            <Mail class="icon-header" />
            <h2 class="profile-section-title">Контакты для связи</h2>
          </div>

          <div class="form-grid-3">
            <div class="input-group">
              <label class="input-label">Телефон*</label>
              <input
                v-model="userData.phone"
                type="text"
                placeholder="+7 (999) 000-00-00"
                class="input"
              />
            </div>
            <div class="input-group">
              <label class="input-label">Email организации*</label>
              <input
                v-model="userData.email"
                type="email"
                placeholder="info@company.ru"
                class="input"
              />
            </div>
            <div class="input-group">
              <label class="input-label">Факс</label>
              <input v-model="userData.fax" type="text" placeholder="-" class="input" />
            </div>
          </div>
        </div>

        <div class="flex flex-col gap-20 section-divider">
          <div class="flex items-center gap-12 pb-12 border-line">
            <MapPin class="icon-header" />
            <h2 class="profile-section-title">Адреса регистрации</h2>
          </div>

          <div class="flex flex-col gap-16">
            <div class="input-group">
              <label class="input-label">Юридический адрес</label>
              <input
                v-model="userData.jurAdress"
                type="text"
                placeholder="101000, г. Москва, ул. Ленина, д. 1"
                class="input"
              />
            </div>
            <div class="input-group">
              <label class="input-label">Фактический / Почтовый адрес</label>
              <input
                v-model="userData.postAdress"
                type="text"
                placeholder="101000, г. Москва, ул. Ленина, д. 1"
                class="input"
              />
            </div>
          </div>
        </div>

        <div class="w-full pt-24 border-line-top form-footer">
          <button
            class="btn btn-primary btn-submit-center"
            :disabled="isSaving"
            :class="{ 'is-loading': isSaving }"
            @click="saveProfile"
          >
            <div v-if="isSaving" class="btn-spinner"></div>
            <span v-else>Сохранить изменения профиля</span>
          </button>
        </div>
      </form>
    </div>
    <TheToast ref="toastRef" />
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Building2, Mail, MapPin } from 'lucide-vue-next'
import { jurpersonService } from '@/api/jurpersonService'
import { useAsync } from '@/composables/useAsync'
import type { UpdateJurpersonRequest } from '@/api/types'

import MainLayout from '@/components/ui/MainLayout.vue'
import TheToast from '@/components/ui/TheToast.vue'

const toastRef = ref<InstanceType<typeof TheToast> | null>(null)
const { loading, run } = useAsync()
const { loading: isSaving, run: runSave } = useAsync()

const userData = reactive<UpdateJurpersonRequest>({
  jurpersonName: '',
  jurpersonFullName: '',
  jurAdress: '',
  postAdress: '',
  inn: '',
  phone: '',
  fax: '',
  kpp: '',
  email: '',
  agreeNum: '',
})

const loadProfileData = () => {
  run(
    async () => {
      const jurData = await jurpersonService.getJurpersons()
      const activeId = jurData.activeId || jurData.jurpersons?.[0]?.idJurperson
      if (activeId) localStorage.setItem('selected_jurperson_id', activeId.toString())

      const data = await jurpersonService.getJurperson()
      Object.assign(userData, data)

      if (!userData.inn) {
        toastRef.value?.show('Рекомендуем заполнить ИНН для корректной работы', 'warning')
      }
    },
    { toast: toastRef.value },
  )
}

const saveProfile = () => {
  runSave(
    async () => {
      const res = await jurpersonService.updateJurperson({ ...userData })
      toastRef.value?.show(res.message || 'Данные сохранены успешно!', 'success')
    },
    { toast: toastRef.value },
  )
}

onMounted(loadProfileData)
</script>

<style scoped>
.page-header {
  padding: var(--spacing-16) var(--spacing-24);
}
.border-line {
  border-bottom: 1px solid var(--color-border);
}
.border-line-top {
  border-top: 1px solid var(--color-border);
}
.icon-header {
  width: 18px;
  height: 18px;
  color: var(--color-text-secondary);
}

/* Разделитель блоков формы — добавляет воздух сверху, убирая кашу */
.section-divider {
  margin-top: var(--spacing-16);
}

.profile-section-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-primary);
  letter-spacing: -0.01em;
}

.input-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-secondary);
  margin-left: 2px;
}

.form-grid-2 {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--spacing-20);
}
.form-grid-3 {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--spacing-20);
}

/* Стили для центровки зоны отправки данных */
.form-footer {
  display: flex;
  justify-content: center;
  margin-top: var(--spacing-12);
}

/* Спартанская фиксированная кнопка по центру */
.btn-submit-center {
  width: 100%;
  max-width: 320px;
}

/* Спиннер загрузки */
.btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-full);
  border-top-color: currentColor;
  animation: btn-spin 0.6s linear infinite;
}
@keyframes btn-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
