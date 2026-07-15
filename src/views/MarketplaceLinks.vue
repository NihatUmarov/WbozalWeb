<template>
  <MainLayout>
    <div class="flex flex-col gap-16 p-16">
      <!-- Шапка страницы -->
      <div class="card flex flex-wrap items-center justify-between gap-12 p-16">
        <div class="flex flex-col gap-4">
          <h2 class="text-xl font-bold text-primary m-0">Интеграция с маркетплейсами</h2>
          <p class="text-xs text-muted m-0">
            Связывайте карточки WB и OZON с товарами или комплектами на складе для автоматической
            выгрузки остатков
          </p>
        </div>
      </div>

      <!-- Переключатель вкладок (Табы) — WB ТЕПЕРЬ ПЕРВЫЙ -->
      <div class="page-tabs">
        <button
          :class="['tab-btn', { 'tab-btn--active': activeTab === 'wb' }]"
          @click="switchTab('wb')"
        >
          Wildberries FBS
        </button>
        <button
          :class="['tab-btn', { 'tab-btn--active': activeTab === 'ozon' }]"
          @click="switchTab('ozon')"
        >
          OZON FBS
        </button>
      </div>

      <!-- ТАБЛИЦА WB (Первый таб) -->
      <div v-if="activeTab === 'wb'" class="card no-padding overflow-hidden">
        <BaseTable
          :items="wbProducts"
          :columns="wbColumns"
          :loading="loading"
          @rowClick="openLinkModal"
        >
          <template #cell(linkedIdName)="{ item }">
            <div class="flex flex-col min-w-0 gap-4" v-if="item.linkedIdName">
              <span class="text-xs font-bold text-primary truncate">{{ item.linkedName }}</span>
              <span class="text-[10px] text-muted font-mono">
                ID: {{ item.linkedIdName }} | Арт: {{ item.linkedArt }}
              </span>
              <span
                v-if="item.isLinkedToKit"
                class="badge badge--info text-[9px] py-2 px-6 self-start"
              >
                Связан с комплектом
              </span>
            </div>
            <span v-else class="badge badge--error text-[10px] py-2 px-6">Не привязан</span>
          </template>

          <template #cell(vendorCode)="{ item }">
            <span class="font-mono text-xs text-muted bg-secondary border-dark px-6 py-4 rounded-6">
              {{ item.vendorCode || '—' }}
            </span>
          </template>
        </BaseTable>
      </div>

      <!-- ТАБЛИЦА OZON (Второй таб) -->
      <div v-if="activeTab === 'ozon'" class="card no-padding overflow-hidden">
        <BaseTable
          :items="ozonProducts"
          :columns="ozonColumns"
          :loading="loading"
          @rowClick="openLinkModal"
        >
          <template #cell(linkedIdName)="{ item }">
            <div class="flex flex-col min-w-0 gap-4" v-if="item.linkedIdName">
              <span class="text-xs font-bold text-primary truncate">{{ item.linkedName }}</span>
              <span class="text-[10px] text-muted font-mono">
                ID: {{ item.linkedIdName }} | Арт: {{ item.linkedArt }}
              </span>
              <span
                v-if="item.isLinkedToKit"
                class="badge badge--info text-[9px] py-2 px-6 self-start"
              >
                Связан с комплектом
              </span>
            </div>
            <span v-else class="badge badge--error text-[10px] py-2 px-6">Не привязан</span>
          </template>

          <template #cell(sku)="{ item }">
            <span class="font-mono text-xs text-muted bg-secondary border-dark px-6 py-4 rounded-6">
              {{ item.sku || '—' }}
            </span>
          </template>
        </BaseTable>
      </div>
    </div>

    <!-- МОДАЛЬНОЕ ОКНО ПРИВЯЗКИ ТОВАРА/КОМПЛЕКТА -->
    <BaseDialog v-model:is-open="isLinkModalOpen" variant="modal" max-width="2xl">
      <template #header>
        <h2 class="text-lg font-bold m-0">Настройка связи со складом</h2>
      </template>

      <div class="flex flex-col gap-16 py-8" v-if="selectedMarketplaceProduct">
        <!-- Карточка маркетплейса (Что привязываем) -->
        <div class="flex flex-col gap-8 p-16 bg-secondary rounded-8 border-dark">
          <span class="text-[10px] font-bold text-muted uppercase tracking-wider block">
            Карточка на маркетплейсе:
          </span>
          <div class="font-bold text-sm text-primary">
            {{ selectedMarketplaceProduct.marketplaceName }}
          </div>
          <div class="text-xs text-muted mt-2 font-mono">
            Артикул МП:
            <span class="font-bold text-primary">
              {{
                activeTab === 'ozon'
                  ? (selectedMarketplaceProduct as OzonProduct).marking
                  : (selectedMarketplaceProduct as WbProduct).vendorCode
              }}
            </span>
            | Размер: {{ selectedMarketplaceProduct.size || '—' }} | Цвет:
            {{ selectedMarketplaceProduct.color || '—' }}
          </div>
        </div>

        <!-- Разделительная линия вместо смайлика-ссылки -->
        <hr class="border-b" />

        <!-- Блок выбранного товара WMS (Строгий дизайн) -->
        <div v-if="selectedWarehouseCard" class="flex flex-col gap-8">
          <span class="text-[10px] font-bold text-muted uppercase tracking-wider block">
            Привязанный товар WMS:
          </span>

          <div class="flex items-center gap-12 p-12 bg-secondary border-dark rounded-8">
            <div
              class="shrink-0 bg-surface border-dark rounded-6 overflow-hidden flex items-center justify-center"
              style="width: 48px; height: 48px; padding: 4px"
            >
              <img
                v-if="selectedWarehouseCard.primaryImageURL"
                :src="selectedWarehouseCard.primaryImageURL"
                style="object-fit: contain; width: 100%; height: 100%"
              />
              <span class="text-xs font-bold" v-else>N/A</span>
            </div>

            <div class="flex flex-col flex-1 min-w-0 gap-2">
              <div class="flex items-center gap-8">
                <span class="text-sm font-bold text-primary truncate">
                  {{ selectedWarehouseCard.cName || 'Без названия' }}
                </span>
                <span v-if="selectedWarehouseCard.isKit" class="badge badge--info py-2 px-6">
                  Комплект
                </span>
              </div>
              <span class="text-xs text-muted font-mono">
                Арт: {{ selectedWarehouseCard.cArt || '—' }} | ID:
                {{ selectedWarehouseCard.idName }}
              </span>
            </div>

            <button class="btn btn-xs btn-danger-soft shrink-0" @click="selectTarget(null)">
              ✕ Снять привязку
            </button>
          </div>
        </div>

        <!-- Умный поиск товара WMS (Строгий дизайн) -->
        <div v-else class="flex flex-col gap-8">
          <span class="text-[10px] font-bold text-muted uppercase tracking-wider block">
            Привязанный товар WMS:
            <span class="text-error normal-case text-xs font-medium ml-4">(Связь разорвана)</span>
          </span>

          <div class="autocomplete-wrapper" ref="targetAutocompleteRef">
            <input
              type="text"
              v-model="targetSearchQuery"
              class="input w-full"
              placeholder="Введите артикул, название или ID для привязки..."
              @focus="isTargetDropdownOpen = true"
            />

            <Transition name="dropdown-fade">
              <div
                v-if="isTargetDropdownOpen && filteredWarehouseCards.length"
                class="autocomplete-dropdown"
              >
                <div
                  v-for="card in filteredWarehouseCards"
                  :key="card.idName"
                  class="autocomplete-item"
                  @click="selectTarget(card)"
                >
                  <span class="font-mono font-bold text-primary">[{{ card.cArt || '—' }}]</span>
                  <span class="flex-1 truncate">{{ card.cName || 'Без названия' }}</span>
                  <span v-if="card.isKit" class="badge badge--info py-2 px-4 shrink-0 mr-8">
                    Комплект
                  </span>
                  <span class="text-xs text-muted font-mono">ID: {{ card.idName }}</span>
                </div>
              </div>
              <div
                v-else-if="isTargetDropdownOpen && targetSearchQuery.trim()"
                class="autocomplete-dropdown text-center text-muted text-xs p-12"
              >
                Ничего не найдено
              </div>
            </Transition>
          </div>
        </div>
      </div>

      <template #footer>
        <button class="btn btn-secondary" @click="isLinkModalOpen = false">Отмена</button>
        <button class="btn btn-primary" :disabled="isSaving" @click="saveLink">
          <div v-if="isSaving" class="btn-spinner"></div>
          <span v-else>Сохранить связь</span>
        </button>
      </template>
    </BaseDialog>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import BaseTable from '@/components/ui/BaseTable.vue'
import BaseDialog from '@/components/ui/UnifiedUI.vue'
import { cardsService, type OzonProduct, type WbProduct, type CardItem } from '@/api/cardsService'
import { useAsync } from '@/composables/useAsync'
import { useToast } from '@/composables/useToast'
import type { TableColumn } from '@/components/ui/BaseTable.vue'

const toast = useToast()
const { loading, run } = useAsync()
const isSaving = ref(false)

const activeTab = ref<'ozon' | 'wb'>('wb') // ПО УМОЛЧАНИЮ ОТКРЫВАЕМ WB
const ozonProducts = ref<OzonProduct[]>([])
const wbProducts = ref<WbProduct[]>([])
const warehouseCards = ref<CardItem[]>([])

const isLinkModalOpen = ref(false)
const selectedMarketplaceProduct = ref<OzonProduct | WbProduct | null>(null)
const targetIdName = ref<number | null>(null)

// --- Состояния автокомплита ---
const targetSearchQuery = ref('')
const isTargetDropdownOpen = ref(false)
const targetAutocompleteRef = ref<HTMLElement | null>(null)

// Колонки для Ozon
const ozonColumns: TableColumn<OzonProduct>[] = [
  { key: 'marking', label: 'Артикул Ozon', filterable: true, minWidth: '120px' },
  { key: 'sku', label: 'SKU / Код', filterable: true, minWidth: '100px' },
  { key: 'marketplaceName', label: 'Название на Ozon', filterable: true, minWidth: '200px' },
  { key: 'size', label: 'Размер', minWidth: '80px' },
  { key: 'linkedIdName', label: 'Связанный товар WMS', minWidth: '220px' },
]

// Колонки для WB
const wbColumns: TableColumn<WbProduct>[] = [
  { key: 'vendorCode', label: 'Артикул WB', filterable: true, minWidth: '120px' },
  { key: 'marketplaceName', label: 'Название на WB', filterable: true, minWidth: '200px' },
  { key: 'size', label: 'Размер', minWidth: '80px' },
  { key: 'linkedIdName', label: 'Связанный товар WMS', minWidth: '220px' },
]

const switchTab = (tab: 'ozon' | 'wb') => {
  activeTab.value = tab
  fetchData()
}

const fetchData = () => {
  run(async () => {
    warehouseCards.value = await cardsService.getCards()

    if (activeTab.value === 'ozon') {
      ozonProducts.value = await cardsService.getOzonProducts()
    } else {
      wbProducts.value = await cardsService.getWbProducts()
    }
  })
}

// --- Логика Умного Поиска ---
const filteredWarehouseCards = computed(() => {
  const query = targetSearchQuery.value.toLowerCase().trim()
  if (!query) return warehouseCards.value.slice(0, 10)

  return warehouseCards.value
    .filter((card) => {
      const art = (card.cArt || '').toLowerCase()
      const name = (card.cName || '').toLowerCase()
      const id = String(card.idName)
      return art.includes(query) || name.includes(query) || id.includes(query)
    })
    .slice(0, 15)
})

const selectedWarehouseCard = computed(() => {
  if (!targetIdName.value) return null
  return warehouseCards.value.find((c) => c.idName === targetIdName.value) || null
})

const openLinkModal = (item: OzonProduct | WbProduct) => {
  selectedMarketplaceProduct.value = item
  targetIdName.value = item.linkedIdName
  targetSearchQuery.value = ''
  isTargetDropdownOpen.value = false
  isLinkModalOpen.value = true
}

const selectTarget = (card: CardItem | null) => {
  targetIdName.value = card ? card.idName : null
  isTargetDropdownOpen.value = false
  targetSearchQuery.value = ''
}

const saveLink = async () => {
  if (!selectedMarketplaceProduct.value) return
  isSaving.value = true

  try {
    if (activeTab.value === 'ozon') {
      const ozonProd = selectedMarketplaceProduct.value as OzonProduct
      await cardsService.linkOzonProduct({
        idOzonProduct: ozonProd.idOzonProduct,
        newIdName: targetIdName.value,
      })
    } else {
      const wbProd = selectedMarketplaceProduct.value as WbProduct
      await cardsService.linkWbProduct({
        idChrt: wbProd.idChrt,
        newIdName: targetIdName.value,
      })
    }

    if (typeof toast.success === 'function') toast.success('Привязка успешно обновлена!')
    isLinkModalOpen.value = false
    fetchData()
  } catch {
    if (typeof toast.error === 'function') toast.error('Не удалось обновить привязку')
  } finally {
    isSaving.value = false
  }
}

const handleClickOutside = (event: MouseEvent) => {
  if (targetAutocompleteRef.value && !targetAutocompleteRef.value.contains(event.target as Node)) {
    isTargetDropdownOpen.value = false
  }
}

onMounted(() => {
  fetchData()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.autocomplete-wrapper {
  position: relative;
  width: 100%;
  display: flex;
  flex-direction: column;
}

.autocomplete-dropdown {
  /* Убираем position: absolute, переводим в относительный поток,
     чтобы overflow: hidden в модалке его больше не резал */
  position: relative;
  width: 100%;
  background: var(--color-surface, #fff); /* Исправили опечатку --scolor-surface */
  border: 1px solid var(--color-border-dark, #ccc);
  border-radius: var(--radius-8, 6px);
  max-height: 180px;
  overflow-y: auto;
  z-index: 50;
  box-shadow: var(--shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.02));
  margin-top: var(--spacing-4, 4px);
}

.autocomplete-item {
  padding: 10px 16px;
  cursor: pointer;
  display: flex;
  gap: 12px;
  font-size: 13px;
  align-items: center;
  transition: background var(--transition-fast);
  color: var(--color-text-primary);
}

.autocomplete-item:hover {
  background: var(--color-background-secondary);
}

/* Стилизация скроллбара дропдауна под общую дизайн-систему */
.autocomplete-dropdown {
  scrollbar-width: thin;
}
</style>
