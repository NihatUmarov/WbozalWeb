<template>
  <MainLayout>
    <div class="w-full max-w-4xl mx-auto py-6 px-4">
      <FormLayout
        title="Профиль организации"
        :loading="loading"
        loading-text="Загрузка данных организации..."
      >
        <div class="flex flex-col gap-10 py-2">
          <div class="flex flex-col gap-5">
            <div class="flex items-center gap-2.5 pb-3 border-b border-border mb-2">
              <Building2 class="w-4 h-4 text-secondary" />
              <h3 class="text-sm font-bold text-primary uppercase tracking-wide m-0">
                Юридические данные
              </h3>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-1 gap-5">
              <BaseInput
                v-model="userData.jurpersonName"
                label="Наименование Юр. лица (для списков)*"
                placeholder="ООО 'Компания'"
              />
              <BaseInput v-model="userData.inn" label="ИНН*" placeholder="123456789012" />
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-1 gap-5">
              <BaseInput
                v-model="userData.jurpersonFullName"
                label="Полное наименование организации*"
                placeholder="Общество с ограниченной ответственностью..."
              />
              <BaseInput v-model="userData.kpp" label="КПП" placeholder="123456789" />
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-1 gap-5">
              <BaseInput
                v-model="userData.agreeNum"
                label="Номер договора со складом"
                placeholder="ДГ-12345"
              />
              <div class="hidden sm:block"></div>
            </div>
          </div>

          <div class="flex flex-col gap-5">
            <div class="flex items-center gap-2.5 pb-3 border-b border-border mb-2 mt-4">
              <Mail class="w-4 h-4 text-secondary" />
              <h3 class="text-sm font-bold text-primary uppercase tracking-wide m-0">
                Контакты для связи
              </h3>
            </div>
            <div class="grid grid-cols-3 sm:grid-cols-1 gap-5">
              <BaseInput
                v-model="userData.phone"
                label="Телефон*"
                placeholder="+7 (999) 000-00-00"
              />
              <BaseInput
                v-model="userData.email"
                label="Email организации*"
                placeholder="info@company.ru"
              />
              <BaseInput v-model="userData.fax" label="Факс" placeholder="-" />
            </div>
          </div>

          <div class="flex flex-col gap-5">
            <div class="flex items-center gap-2.5 pb-3 border-b border-border mb-2 mt-4">
              <MapPin class="w-4 h-4 text-secondary" />
              <h3 class="text-sm font-bold text-primary uppercase tracking-wide m-0">
                Адреса регистрации
              </h3>
            </div>
            <div class="flex flex-col gap-5">
              <BaseInput
                v-model="userData.jurAdress"
                label="Юридический адрес"
                placeholder="101000, г. Москва, ул. Ленина, д. 1"
              />
              <BaseInput
                v-model="userData.postAdress"
                label="Фактический / Почтовый адрес"
                placeholder="101000, г. Москва, ул. Ленина, д. 1"
              />
            </div>
          </div>
        </div>

        <template #footer>
          <div class="w-full pt-2 mt-6">
            <BaseButton :loading="isSaving" class="w-full" @click="saveProfile">
              Сохранить изменения профиля
            </BaseButton>
          </div>
        </template>
      </FormLayout>
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
import FormLayout from '@/components/ui/FormLayout.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
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
