<template>
  <MainLayout>
    <FormLayout
      title="Профиль организации"
      :loading="isPageLoading"
      loading-text="Загрузка данных организации..."
    >
      <template #actions>
        <div class="form-section">
          <h3 class="section-subtitle">Основная информация</h3>
          <div class="grid grid-cols-2 gap-5">
            <BaseInput
              v-model="userData.jurpersonName"
              label="Наименование Юр. лица:"
              placeholder="ООО 'Компания'"
            />
            <BaseInput v-model="userData.inn" label="ИНН:*" placeholder="123456789012" />
          </div>
          <div class="grid grid-cols-2 gap-5">
            <BaseInput
              v-model="userData.jurpersonFullName"
              label="Полное наименование:*"
              placeholder="Общество с ограниченной ответственностью..."
            />
            <BaseInput v-model="userData.kpp" label="КПП:" placeholder="123456789" />
          </div>
          <div class="grid grid-cols-2 gap-5">
            <BaseInput v-model="userData.phone" label="Телефон:" placeholder="+7 (___) ___-__-__" />
            <BaseInput
              v-model="userData.email"
              label="Email организации:"
              placeholder="info@company.ru"
            />
          </div>
          <div class="grid grid-cols-2 gap-5">
            <BaseInput v-model="userData.agreeNum" label="Номер договора:" placeholder="ДГ-12345" />
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
        </div>

        <hr class="divider" />

        <div class="form-section">
          <h3 class="section-subtitle">Банковские реквизиты</h3>
          <div class="grid grid-cols-2 gap-5">
            <BaseInput v-model="userData.bik" label="БИК:" placeholder="044525225" />
            <BaseInput
              v-model="userData.bank"
              label="Наименование банка:"
              placeholder="ПАО SBERBANK"
            />
          </div>
          <div class="grid grid-cols-2 gap-5">
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
      </template>

      <template #footer>
        <BaseButton :loading="isSaving" @click="saveProfile" class="max-w-xs"
          >Сохранить изменения</BaseButton
        >
      </template>
    </FormLayout>
    <TheToast ref="toastRef" />
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import axios from 'axios'
import MainLayout from '@/components/ui/MainLayout.vue'
import FormLayout from '@/components/ui/FormLayout.vue'
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
    if (selectedId) localStorage.setItem('selected_jurperson_id', selectedId.toString())

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
    if (!userData.inn)
      toastRef.value?.show('Рекомендуем заполнить ИНН для корректной работы', 'warning')
  } catch (error: unknown) {
    let msg = 'Не удалось загрузить данные профиля.'
    if (axios.isAxiosError(error) && error.response?.data) {
      const d = error.response.data as { message?: string }
      if (d.message) msg = d.message
    }
    toastRef.value?.show(msg, 'error')
  } finally {
    isPageLoading.value = false
  }
}

onMounted(loadBrandData)

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
    isSaving.value = false
  }
}
</script>

<style scoped>
.form-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-12);
  margin-bottom: var(--spacing-20);
}
.section-subtitle {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
  margin: var(--spacing-10) 0 var(--spacing-5);
}
.divider {
  border: 0;
  height: 1px;
  background: var(--color-border);
  margin: var(--spacing-15) 0;
}
@media (max-width: 640px) {
  .grid {
    grid-template-columns: 1fr !important;
  }
}
</style>
