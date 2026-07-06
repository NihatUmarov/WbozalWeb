<template>
  <MainLayout>
    <div class="w-full max-w-4xl mx-auto py-6 px-4 flex flex-col gap-20">
      <div class="card flex items-center justify-between gap-12 px-24 py-16">
        <h1 class="m-0">Профиль организации</h1>

        <div class="flex items-center gap-12">
          <button
            type="button"
            class="btn btn-secondary flex items-center gap-6"
            @click="showEditProfile = true"
          >
            <span>📝 Редактировать юр. данные</span>
          </button>

          <button
            type="button"
            class="btn btn-secondary flex items-center gap-6"
            :disabled="!permissions.admin"
            @click="showUserManagement = true"
          >
            <span>👥 Добавить сотрудника</span>
          </button>
        </div>
      </div>

      <div
        v-if="loading"
        class="card text-center py-40 text-muted flex flex-col items-center justify-center gap-12"
      >
        <div class="table-spinner"></div>
        <p class="text-sm font-medium">Загрузка данных организации...</p>
      </div>

      <template v-else>
        <div class="card flex flex-col gap-20">
          <div class="flex items-center gap-12 pb-12 border-b">
            <h2 class="text-base font-bold text-primary m-0">Настройки отображения таблиц</h2>
          </div>

          <div class="flex flex-col gap-12">
            <label class="input-label">
              Выберите колонки, которые должны отображаться в таблицах товаров:
            </label>

            <div class="flex flex-wrap items-center gap-12 mt-4">
              <button
                type="button"
                :class="[
                  'btn btn-xs px-12 h-32 rounded-6 transition-all font-medium',
                  showImage ? 'btn-primary shadow-sm' : 'btn-secondary text-muted',
                ]"
                @click="showImage = !showImage"
              >
                {{ showImage ? 'Фото: Показываю' : 'Фото: Скрыто' }}
              </button>

              <button
                type="button"
                :class="[
                  'btn btn-xs px-12 h-32 rounded-6 transition-all font-medium',
                  showArt ? 'btn-primary shadow-sm' : 'btn-secondary text-muted',
                ]"
                @click="showArt = !showArt"
              >
                {{ showArt ? 'Артикул: Показываю' : 'Артикул: Скрыто' }}
              </button>

              <button
                type="button"
                :class="[
                  'btn btn-xs px-12 h-32 rounded-6 transition-all font-medium',
                  showWbArt ? 'btn-primary shadow-sm' : 'btn-secondary text-muted',
                ]"
                @click="showWbArt = !showWbArt"
              >
                {{ showWbArt ? 'Арт. WB: Показываю' : 'Арт. WB: Скрыто' }}
              </button>

              <button
                type="button"
                :class="[
                  'btn btn-xs px-12 h-32 rounded-6 transition-all font-medium',
                  showSize ? 'btn-primary shadow-sm' : 'btn-secondary text-muted',
                ]"
                @click="showSize = !showSize"
              >
                {{ showSize ? 'Размер: Показываю' : 'Размер: Скрыто' }}
              </button>
            </div>
          </div>
        </div>

        <div class="card flex flex-col gap-24">
          <div class="flex items-center gap-12 pb-12 border-b">
            <h2 class="text-base font-bold text-primary m-0">
              Интеграция с личными кабинетами маркетплейсов
            </h2>
          </div>

          <div class="flex flex-col w-full">
            <div class="page-tabs mb-24">
              <button
                v-for="tab in tabsConfig"
                :key="tab.value"
                type="button"
                :class="['tab-btn', { 'tab-btn--active': activeTab === tab.value }]"
                @click="setTab(tab.value)"
              >
                <span>{{ tab.label }}</span>
              </button>
            </div>

            <div class="flex flex-col gap-20" :class="{ 'opacity-60': loadingToken }">
              <div class="inputs-grid">
                <div class="input-group">
                  <label class="input-label">API Токен</label>
                  <input
                    v-model="tokensData[activeTab].value"
                    type="text"
                    :placeholder="
                      activeTab === 'WB' ? 'Вставьте токен WB (JWT)...' : 'Вставьте API Key Ozon...'
                    "
                    class="input"
                    :disabled="loadingToken"
                  />
                </div>

                <div class="input-group">
                  <label class="input-label">
                    {{ activeTab === 'WB' ? 'ID Склада WB' : 'Client ID / ID Seller' }}
                  </label>
                  <input
                    v-model="tokensData[activeTab].appKey"
                    type="text"
                    :placeholder="activeTab === 'WB' ? 'Например: 1127304' : 'Например: 1723361'"
                    class="input"
                    :disabled="loadingToken"
                  />
                </div>

                <div v-if="activeTab === 'OZ'" class="input-group">
                  <label class="input-label">ID Склада Ozon</label>
                  <input
                    v-model="tokensData.OZ.appSecret"
                    type="text"
                    placeholder="Например: 1020001713766000"
                    class="input"
                    :disabled="loadingToken"
                  />
                </div>
              </div>

              <div class="pt-16 border-t flex justify-end mt-24">
                <button
                  class="btn btn-primary max-w-xs"
                  :disabled="isSavingToken || loadingToken"
                  @click="saveMarketplaceSettings"
                >
                  <span
                    v-if="isSavingToken"
                    class="table-spinner"
                    style="width: 16px; height: 16px"
                  ></span>
                  <span v-else>Сохранить ключи {{ activeTab }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <UserManagementModal v-model:is-open="showUserManagement" />

    <BaseModal v-model:is-open="showEditProfile" maxWidth="4xl">
      <template #header>
        <h3 class="m-0 text-lg font-bold text-primary">Редактирование профиля организации</h3>
      </template>

      <form @submit.prevent class="flex flex-col gap-32 py-12">
        <div class="flex flex-col gap-16">
          <div class="flex items-center gap-12 pb-8 border-b">
            <h4 class="text-sm font-bold text-secondary m-0">Юридические данные</h4>
          </div>
          <div class="inputs-grid">
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
                placeholder="Общество с ограниченной..."
                class="input"
              />
            </div>
            <div class="input-group">
              <label class="input-label">КПП</label>
              <input v-model="userData.kpp" type="text" placeholder="123456789" class="input" />
            </div>
            <div class="input-group">
              <label class="input-label">Номер договора</label>
              <input v-model="userData.agreeNum" type="text" placeholder="ДГ-12345" class="input" />
            </div>
          </div>
        </div>

        <div class="flex flex-col gap-16">
          <div class="flex items-center gap-12 pb-8 border-b">
            <h4 class="text-sm font-bold text-secondary m-0">Контакты для связи</h4>
          </div>
          <div class="inputs-grid">
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

        <div class="flex flex-col gap-16">
          <div class="flex items-center gap-12 pb-8 border-b">
            <h4 class="text-sm font-bold text-secondary m-0">Адреса регистрации</h4>
          </div>
          <div class="inputs-grid">
            <div class="input-group">
              <label class="input-label">Юридический адрес</label>
              <input
                v-model="userData.jurAdress"
                type="text"
                placeholder="Юр. адрес"
                class="input"
              />
            </div>
            <div class="input-group">
              <label class="input-label">Фактический / Почтовый адрес</label>
              <input
                v-model="userData.postAdress"
                type="text"
                placeholder="Почтовый адрес"
                class="input"
              />
            </div>
          </div>
        </div>
      </form>

      <template #footer>
        <div class="w-full flex justify-end gap-12">
          <button type="button" class="btn btn-secondary" @click="showEditProfile = false">
            Отмена
          </button>
          <button
            type="button"
            class="btn btn-primary min-w-xs"
            :disabled="isSaving"
            @click="handleSaveProfile"
          >
            <span v-if="isSaving" class="table-spinner" style="width: 16px; height: 16px"></span>
            <span v-else>Сохранить изменения</span>
          </button>
        </div>
      </template>
    </BaseModal>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { jurpersonService } from '@/api/jurpersonService'
import { useAsync } from '@/composables/useAsync'
import { useToast } from '@/composables/useToast'
import type { UpdateJurpersonRequest, SaveMarketplaceTokenRequest } from '@/api/types'

import { useViewSettings } from '@/composables/useViewSettings'
import { usePermissions } from '@/services/permissionsStore'

import MainLayout from '@/components/ui/MainLayout.vue'
import UserManagementModal from './UserManagementModal.vue'
import BaseModal from '@/components/ui/BaseModal.vue'

const showUserManagement = ref<boolean>(false)
const showEditProfile = ref<boolean>(false)
const toast = useToast()

const { loading, run } = useAsync()
const { loading: isSaving, run: runSave } = useAsync()
const { loading: isSavingToken, run: runSaveToken } = useAsync()
const { loading: loadingToken, run: runToken } = useAsync()

const { showImage, showArt, showWbArt, showSize } = useViewSettings()
const { permissions, fetchPermissions } = usePermissions()

const activeTab = ref<'WB' | 'OZ'>('WB')
const tabsConfig = [
  { label: 'Wildberries', value: 'WB' },
  { label: 'Ozon', value: 'OZ' },
] as const

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

const tokensData = reactive({
  WB: { value: '', appKey: '', appSecret: null as string | null },
  OZ: { value: '', appKey: '', appSecret: '' },
})

const fetchCurrentTabToken = (tab: 'WB' | 'OZ'): void => {
  runToken(async () => {
    // Вызов скорректирован под сигнатуру примитива без лишней обертки-объекта
    const t = await jurpersonService.getMarketplaceTokenByType(tab)
    tokensData[tab].value = t?.value || ''
    tokensData[tab].appKey = t?.appKey || ''
    if (tab === 'OZ') tokensData.OZ.appSecret = t?.appSecret || ''
  })
}

const setTab = (tab: 'WB' | 'OZ'): void => {
  activeTab.value = tab
  fetchCurrentTabToken(tab)
}

const loadProfileData = (): void => {
  run(
    async () => {
      await fetchPermissions()

      const jurData = await jurpersonService.getJurpersons()
      const activeId = jurData.activeId || jurData.jurpersons?.[0]?.idJurperson
      if (activeId) localStorage.setItem('selected_jurperson_id', activeId.toString())

      const data = await jurpersonService.getJurperson()
      Object.assign(userData, data)

      if (!userData.inn) {
        toast.warning('Рекомендуем заполнить ИНН для корректной работы')
      }
      fetchCurrentTabToken(activeTab.value)
    },
    { toast },
  )
}

const handleSaveProfile = (): void => {
  runSave(
    async () => {
      const res = await jurpersonService.updateJurperson({ ...userData })
      toast.success(res.message || 'Данные сохранены успешно!')
      showEditProfile.value = false
    },
    { toast },
  )
}

const saveMarketplaceSettings = (): void => {
  runSaveToken(
    async () => {
      const tab = activeTab.value
      const current = tokensData[tab]

      if (
        !current.value.trim() ||
        !current.appKey.trim() ||
        (tab === 'OZ' && !current.appSecret?.trim())
      ) {
        toast.error('Заполните все обязательные поля!')
        return
      }

      const payload: SaveMarketplaceTokenRequest = {
        marketplace: tab,
        value: current.value,
        appKey: current.appKey,
        appSecret: tab === 'OZ' ? current.appSecret : null,
      }

      const res = await jurpersonService.saveMarketplaceToken(payload)
      toast.success(res.message || 'Ключи обновлены!')
    },
    { toast },
  )
}

onMounted(loadProfileData)
</script>
