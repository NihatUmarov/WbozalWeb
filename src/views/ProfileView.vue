<template>
  <MainLayout>
    <div class="profile-page-wrapper">
      <h1 class="top-title">Профиль организации</h1>

      <div v-if="isPageLoading" class="loading-container">
        <p>Загрузка данных организации...</p>
      </div>

      <BaseCard v-else width="700" class="a4-sheet">
        <div class="sheet-content">
          <div class="form-section">
            <h3 class="section-subtitle">Основная информация</h3>
            <div class="two-columns">
              <BaseInput
                v-model="userData.jurpersonName"
                label="Наименование Юр. лица:"
                placeholder="ООО 'Компания'"
              />
              <BaseInput v-model="userData.inn" label="ИНН:*" placeholder="123456789012" />
            </div>

            <div class="two-columns">
              <BaseInput
                v-model="userData.jurpersonFullName"
                label="Полное наименование:*"
                placeholder="Общество с ограниченной ответственностью..."
              />
              <BaseInput v-model="userData.kpp" label="КПП:" placeholder="123456789" />
            </div>

            <div class="two-columns">
              <BaseInput
                v-model="userData.phone"
                label="Телефон:"
                placeholder="+7 (___) ___-__-__"
              />
              <BaseInput
                v-model="userData.email"
                label="Email организации:"
                placeholder="info@company.ru"
              />
            </div>

            <div class="two-columns">
              <BaseInput
                v-model="userData.agreeNum"
                label="Номер договора:"
                placeholder="ДГ-12345"
              />
              <BaseInput v-model="userData.fax" label="Факс:" placeholder="-" />
            </div>

            <BaseInput
              v-model="userData.jurAdress"
              label="Юридический адрес:"
              placeholder="г. Москва..."
            />
            <BaseInput
              v-model="userData.postAdress"
              label="Почтовый адрес:"
              placeholder="г. Москва..."
            />

            <hr class="divider" />
            <h3 class="section-subtitle">Банковские реквизиты</h3>

            <div class="two-columns">
              <BaseInput v-model="userData.bik" label="БИК:" placeholder="044525225" />
              <BaseInput
                v-model="userData.bank"
                label="Наименование банка:"
                placeholder="ПАО СБЕРБАНК"
              />
            </div>

            <div class="two-columns">
              <BaseInput
                v-model="userData.rAccount"
                label="Расчетный счет:"
                placeholder="40702810..."
              />
              <BaseInput
                v-model="userData.kAccount"
                label="Корреспондентский счет:"
                placeholder="30101810..."
              />
            </div>
          </div>

          <div class="footer-actions">
            <BaseButton :loading="isSaving" @click="saveProfile"> Сохранить изменения </BaseButton>
          </div>
        </div>
      </BaseCard>
    </div>
  </MainLayout>
  <TheToast ref="toastRef" />
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import axios from 'axios'
import MainLayout from '@/components/ui/MainLayout.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import TheToast from '@/components/ui/TheToast.vue'

import { jurpersonService } from '@/api/jurpersonService'
import type { UpdateJurpersonRequest } from '@/api/types'

const toastRef = ref<InstanceType<typeof TheToast> | null>(null)
const isPageLoading = ref(true)
const isSaving = ref(false)

const userData = reactive<UpdateJurpersonRequest>({
  jurpersonName: '',
  jurpersonFullName: '',
  jurAdress: '',
  postAdress: '',
  rAccount: '',
  kAccount: '',
  bik: '',
  inn: '',
  bank: '',
  okonh: '',
  okpo: '',
  phone: '',
  fax: '',
  kpp: '',
  email: '',
  agreeNum: '',
})

const loadBrandData = async () => {
  try {
    isPageLoading.value = true

    const jurpersonsData = await jurpersonService.getJurpersons()
    const selectedId = jurpersonsData.activeId || jurpersonsData.jurpersons?.[0]?.idJurperson

    if (selectedId) {
      localStorage.setItem('selected_jurperson_id', selectedId.toString())
    }

    const data = await jurpersonService.getJurperson()

    Object.assign(userData, {
      jurpersonName: data.jurpersonName,
      jurpersonFullName: data.jurpersonFullName,
      jurAdress: data.jurAdress,
      postAdress: data.postAdress,
      rAccount: data.rAccount,
      kAccount: data.kAccount,
      bik: data.bik,
      inn: data.inn,
      bank: data.bank,
      okonh: data.okonh,
      okpo: data.okpo,
      phone: data.phone,
      fax: data.fax,
      kpp: data.kpp,
      email: data.email,
      agreeNum: data.agreeNum,
    })

    if (!userData.inn) {
      toastRef.value?.show('Рекомендуем заполнить ИНН для корректной работы', 'warning')
    }
  } catch (error: unknown) {
    let msg = 'Не удалось загрузить данные профиля.'
    if (axios.isAxiosError(error) && error.response?.data) {
      const d = error.response.data as { message?: string }
      if (d.message) msg = d.message
    }
    toastRef.value?.show(msg, 'error')
  } finally {
    // Исправлено тут (было "finaly")
    isPageLoading.value = false
  }
}

onMounted(() => {
  loadBrandData()
})

const saveProfile = async () => {
  isSaving.value = true
  try {
    const payload: UpdateJurpersonRequest = { ...userData }
    const response = await jurpersonService.updateJurperson(payload)
    toastRef.value?.show(response.message || 'Данные сохранены успешно!', 'success')
  } catch (error: unknown) {
    let errorMessage = 'Ошибка сохранения данных'
    if (axios.isAxiosError(error) && error.response?.data) {
      const data = error.response.data as { message?: string }
      if (data.message) errorMessage = data.message
    }
    toastRef.value?.show(errorMessage, 'error')
  } finally {
    // Исправлено тут (было "finaly")
    isSaving.value = false
  }
}
</script>

<style scoped>
.profile-page-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background-color: #f8fafc;
}
.top-title {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 30px;
}
.section-subtitle {
  font-size: 16px;
  font-weight: 600;
  color: #4f46e5;
  margin: 10px 0 5px;
}
.divider {
  border: 0;
  height: 1px;
  background: #e2e8f0;
  margin: 15px 0;
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
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
.footer-actions :deep(.base-btn) {
  max-width: 280px;
}
@media (max-width: 640px) {
  .two-columns {
    grid-template-columns: 1fr;
  }
}
</style>
