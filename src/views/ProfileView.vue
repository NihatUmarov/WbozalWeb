<template>
  <MainLayout>
    <div class="profile-page-wrapper">
      <h1 class="top-title">Ваш профиль</h1>

      <div v-if="isPageLoading" class="loading-container">
        <p>Загрузка данных профиля...</p>
      </div>

      <BaseCard v-else width="700" class="a4-sheet">
        <div class="sheet-content">
          <div class="form-section">
            <div class="two-columns">
              <BaseInput
                v-model="userData.brandName"
                label="Название бренда:"
                placeholder="Вайлдберриз Бренд"
              />
              <BaseInput
                v-model="userData.emailWork"
                label="Рабочий E-Mail:*"
                placeholder="example@mail.ru"
              />
            </div>

            <div class="two-columns">
              <BaseInput
                v-model="userData.sellerName"
                label="Наименование компании (краткое):*"
                placeholder="ООО 'Компания'"
              />
              <BaseInput
                v-model="userData.sellerFullName"
                label="ФИО / Полное наименование:*"
                placeholder="Иванов Иван Иванович"
              />
            </div>

            <div class="two-columns">
              <BaseInput
                v-model="userData.phoneWork"
                label="Телефон:"
                placeholder="+7 (___) ___-__-__"
              />
              <BaseInput v-model="userData.inn" label="ИНН:" placeholder="123456789012" />
            </div>

            <BaseInput
              v-model="userData.adress"
              label="Юридический адрес:"
              placeholder="г. Москва, ул. Ленина, д. 1"
            />
          </div>

          <div class="marketplace-tabs">
            <button
              v-for="tab in marketplaces"
              :key="tab"
              :class="['tab-link', { active: currentTab === tab }]"
              @click="currentTab = tab"
            >
              {{ tab }}
            </button>
          </div>

          <div class="api-fields">
            <BaseInput
              :model-value="displayToken"
              :label="`Токен ${currentTab}:`"
              placeholder="Токен отсутствует или зашифрован"
              type="password"
              disabled
            />
            <BaseInput
              v-model="warehouseId"
              :label="`ID склада ${currentTab === 'Wildberries' ? 'WB' : currentTab}:`"
              placeholder="Введите ID склада"
            />
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
import { ref, reactive, computed, onMounted } from 'vue'
import axios from 'axios'
import MainLayout from '@/components/ui/MainLayout.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import TheToast from '@/components/ui/TheToast.vue'

import { brandService } from '@/api/brandService'
import type { UpdateBrandRequest } from '@/api/types'

const toastRef = ref<InstanceType<typeof TheToast> | null>(null)
const isPageLoading = ref(true)
const isSaving = ref(false)

const currentTab = ref('Wildberries')
const marketplaces = ['Wildberries', 'OZON', 'Yandex Market', 'СберМегаМаркет']
const warehouseId = ref('1265518')

const userData = reactive<
  UpdateBrandRequest & {
    wbToken?: string | null
    ozToken?: string | null
    sberToken?: string | null
    ymToken?: string | null
  }
>({
  brandName: '',
  sellerName: '',
  sellerFullName: '',
  emailWork: '',
  phoneWork: '',
  adress: '',
  inn: '',
})

const displayToken = computed(() => {
  switch (currentTab.value) {
    case 'Wildberries':
      return userData.wbToken || ''
    case 'OZON':
      return userData.ozToken || ''
    case 'СберМегаМаркет':
      return userData.sberToken || ''
    case 'Yandex Market':
      return userData.ymToken || ''
    default:
      return ''
  }
})

const loadBrandData = async () => {
  try {
    isPageLoading.value = true
    const brandsData = await brandService.getBrands()
    const selectedId = brandsData.selectedBrandId || brandsData.brands?.[0]?.idBrand
    if (selectedId) {
      localStorage.setItem('selected_brand_id', selectedId.toString())
    }

    const data = await brandService.getBrand()
    userData.brandName = data.brandName
    userData.sellerName = data.sellerName
    userData.sellerFullName = data.sellerFullName
    userData.emailWork = data.emailWork
    userData.phoneWork = data.phoneWork
    userData.adress = data.adress
    userData.inn = data.inn
    userData.wbToken = data.wbToken
    userData.ozToken = data.ozToken
    userData.sberToken = data.sberToken
    userData.ymToken = data.ymToken

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
    isPageLoading.value = false
  }
}

onMounted(() => {
  loadBrandData()
})

const saveProfile = async () => {
  isSaving.value = true
  try {
    const payload: UpdateBrandRequest = {
      brandName: userData.brandName,
      sellerName: userData.sellerName,
      sellerFullName: userData.sellerFullName,
      emailWork: userData.emailWork,
      phoneWork: userData.phoneWork,
      adress: userData.adress,
      inn: userData.inn,
    }
    const response = await brandService.updateBrand(payload)
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

.marketplace-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 15px 0 25px;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 15px;
}

.tab-link {
  padding: 8px 16px;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  background: white;
  cursor: pointer;
  font-size: 13px;
  color: #64748b;
  transition: all 0.3s ease;
}

.tab-link.active {
  background: #4f46e5;
  color: white;
  border-color: #4f46e5;
  box-shadow: 0 4px 10px rgba(79, 70, 229, 0.2);
}

.api-fields {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 20px;
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
