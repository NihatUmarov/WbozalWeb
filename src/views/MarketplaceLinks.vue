<template>
  <MainLayout>
    <BaseDataPage
      ref="dataPageRef"
      title="Интеграция с маркетплейсами"
      :items="activeTab === 'ozon' ? ozonProducts : wbProducts"
      :columns="activeTab === 'ozon' ? (ozonColumns as TableColumn<OzonProduct | WbProduct>[]) : (wbColumns as TableColumn<OzonProduct | WbProduct>[])"
      :loading="loading"
      :tabs="[
        { label: 'Wildberries FBS', value: 'wb' },
        { label: 'OZON FBS', value: 'ozon' }
      ]"
      :current-tab="activeTab"
      @tab-change="switchTab($event as 'ozon' | 'wb')"
    >
      <template #header-actions>
        <div class="flex items-center gap-12">
          <button class="btn btn-secondary flex items-center gap-8" @click="isImportModalOpen = true">
            <img src="@/components/icons/office-exel.svg" alt="Excel" width="20" height="20" />
            <span>Импорт статусов</span>
          </button>
          <button class="btn btn-primary flex items-center gap-8" :disabled="isSyncing" @click="handleSync">
            <span v-if="isSyncing" class="btn-spinner" />
            <span>Обновить из МП</span>
          </button>
        </div>
      </template>

      <template #default="{ registerTable }">
        <BaseTable
          :ref="registerTable"
          :items="activeTab === 'ozon' ? (ozonProducts as (OzonProduct | WbProduct)[]) : (wbProducts as (OzonProduct | WbProduct)[])"
          :columns="activeTab === 'ozon' ? (ozonColumns as TableColumn<OzonProduct | WbProduct>[]) : (wbColumns as TableColumn<OzonProduct | WbProduct>[])"
          :loading="loading"
          :row-height="80"
          @row-click="openLinkModal($event)"
        >
          <template #cell(photo)="{ item }">
            <div class="w-[40px] h-[60px] flex items-center justify-center bg-secondary rounded-6 overflow-hidden mx-auto">
              <img v-if="item.linkedImage" :src="String(item.linkedImage)" alt="P" class="object-contain w-full h-full" />
              <span v-else class="text-[10px] text-muted">No</span>
            </div>
          </template>

          <template #cell(linkedIdName)="{ item }">
            <div class="flex flex-col min-w-0 gap-2" v-if="item.linkedIdName">
              <AppTableCell :value="item.linkedName" bold size="xs" />
              <div class="flex items-center gap-6">
                <AppTableCell :value="`ID: ${item.linkedIdName} | Арт: ${item.linkedArt}`" mono size="xs" color="muted" />
                <AppBadge v-if="item.isLinkedToKit" variant="info" text="Комплект" />
              </div>
            </div>
            <AppBadge v-else variant="error" text="Не привязан" />
          </template>

          <template #cell(barcodes)="{ item }">
            <div class="barcodes-wrap-list min-w-0" v-if="item.barcodes?.length">
              <AppTableCell v-for="bc in item.barcodes" :key="bc" :value="bc" mono size="xs" color="muted" />
            </div>
            <AppTableCell v-else value="—" color="muted" align="center" />
          </template>

          <template #cell(isActive)="{ item }">
            <div class="flex justify-center" @click.stop>
              <label class="toggle">
                <input type="checkbox" :checked="!!item.isActive" @change="toggleActive(item)" />
                <div class="toggle-track" />
                <span>{{ item.isActive ? 'В продаже' : 'Стоп' }}</span>
              </label>
            </div>
          </template>
        </BaseTable>
      </template>
    </BaseDataPage>

    <!-- Modal for Linking -->
    <BaseDialog v-model:is-open="isLinkModalOpen" variant="modal" max-width="2xl">
      <template #header><h2 class="text-lg font-bold m-0">Настройка связи</h2></template>
      <div class="flex flex-col gap-16 py-8" v-if="selectedMarketplaceProduct">
        <div class="flex flex-col gap-8 p-16 bg-secondary rounded-8 border-dark">
          <span class="text-[10px] font-bold text-muted uppercase tracking-wider block">Маркетплейс:</span>
          <div class="font-bold text-sm text-primary">{{ selectedMarketplaceProduct.marketplaceName }}</div>
          <div class="text-xs text-muted mt-2 font-mono">
            Арт: <span class="font-bold text-primary">{{ activeTab === 'ozon' ? (selectedMarketplaceProduct as OzonProduct).marking : (selectedMarketplaceProduct as WbProduct).vendorCode }}</span>
          </div>
        </div>
        <hr class="border-b" />
        <div v-if="selectedWarehouseCard" class="flex flex-col gap-8">
          <span class="text-[10px] font-bold text-muted uppercase tracking-wider block">Товар WMS:</span>
          <div class="flex items-center gap-12 p-12 bg-secondary border-dark rounded-8">
            <div class="shrink-0 bg-surface border-dark rounded-6 overflow-hidden flex items-center justify-center" style="width: 48px; height: 48px; padding: 4px">
              <img v-if="selectedWarehouseCard.primaryImageURL" :src="selectedWarehouseCard.primaryImageURL" style="object-fit: contain; width: 100%; height: 100%" />
              <span class="text-xs font-bold" v-else>N/A</span>
            </div>
            <div class="flex flex-col flex-1 min-w-0 gap-2">
              <div class="flex items-center gap-8">
                <AppTableCell :value="selectedWarehouseCard.cName || 'Без названия'" bold />
                <AppBadge v-if="selectedWarehouseCard.isKit" variant="info" text="Комплект" />
              </div>
              <AppTableCell :value="`Арт: ${selectedWarehouseCard.cArt || '—'} | ID: ${selectedWarehouseCard.idName}`" mono size="xs" color="muted" />
            </div>
            <button class="btn btn-xs btn-danger-soft shrink-0" @click="selectTarget(null)">✕ Снять</button>
          </div>
        </div>
        <div v-else class="flex flex-col gap-8">
          <div class="autocomplete-wrapper" ref="targetAutocompleteRef">
            <input type="text" v-model="targetSearchQuery" class="input w-full" placeholder="Поиск для привязки..." @focus="isTargetDropdownOpen = true" />

            <!-- Обычный поток без absolute, чтоб растягивать модалку по вертикали -->
            <div v-if="isTargetDropdownOpen && filteredWarehouseCards.length" class="autocomplete-list">
              <div v-for="card in filteredWarehouseCards" :key="card.idName" class="autocomplete-item" @click="selectTarget(card)">
                <AppTableCell :value="`[${card.cArt || '—'}]`" mono bold color="brand" />
                <span class="flex-1 truncate">{{ card.cName || 'Без названия' }}</span>
                <AppBadge v-if="card.isKit" variant="info" text="Комплект" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <button class="btn btn-secondary" @click="isLinkModalOpen = false">Отмена</button>
        <button class="btn btn-primary" :disabled="isSaving" @click="saveLink">
          <span v-if="isSaving" class="btn-spinner" />
          <span v-else>Сохранить связь</span>
        </button>
      </template>
    </BaseDialog>

    <BaseDialog v-model:is-open="isImportModalOpen" variant="modal" max-width="2xl">
      <template #header><h2 class="text-xl font-bold m-0">Массовое обновление статусов</h2></template>
      <StopListBulkImportModal v-if="isImportModalOpen" :catalog-stop-list="activeTab === 'ozon' ? (ozonProducts as MarketplaceProduct[]) : (wbProducts as MarketplaceProduct[])" :marketplace="activeTab" @close="isImportModalOpen = false" @updated="fetchData" />
    </BaseDialog>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import BaseDataPage, { type DataPageExposed } from '@/components/ui/BaseDataPage.vue'
import BaseTable, { AppBadge, AppTableCell, type TableColumn } from '@/components/ui/BaseTable.vue'
import BaseDialog from '@/components/ui/UnifiedUI.vue'
import StopListBulkImportModal from '@/components/modals/StopListBulkImportModal.vue'
import { productService, type OzonProduct, type WbProduct, type MarketplaceProduct } from '@/api/productService'
import type { Product } from '@/api/types'
import { useAsync } from '@/composables/useAsync'
import { useToast } from '@/composables/useToast'

const toast = useToast(), { loading, run } = useAsync(), isSaving = ref(false), isImportModalOpen = ref(false)
const activeTab = ref<'ozon' | 'wb'>('wb'), ozonProducts = ref<OzonProduct[]>([]), wbProducts = ref<WbProduct[]>([]), warehouseCards = ref<Product[]>([])
const isLinkModalOpen = ref(false), selectedMarketplaceProduct = ref<OzonProduct | WbProduct | null>(null), targetIdName = ref<number | null>(null)
const targetSearchQuery = ref(''), isTargetDropdownOpen = ref(false), targetAutocompleteRef = ref<HTMLElement | null>(null), isSyncing = ref(false)
const dataPageRef = ref<DataPageExposed | null>(null)

const ozonColumns: TableColumn<OzonProduct>[] = [
  { key: 'photo', label: 'Фото', width: '60px' },
  { key: 'marking', label: 'Артикул Ozon', filterable: true, minWidth: '100px' },
  { key: 'marketplaceName', label: 'Название на Ozon', filterable: true, minWidth: '180px' },
  { key: 'size', label: 'Размер', filterable: true, width: '70px' },
  { key: 'barcodes', label: 'Штрихкоды', filterable: true, minWidth: '110px' },
  { key: 'linkedIdName', label: 'Связь WMS', minWidth: '220px' },
  { key: 'isActive', label: 'В продаже', width: '120px' }
]

const wbColumns: TableColumn<WbProduct>[] = [
  { key: 'photo', label: 'Фото', width: '60px' },
  { key: 'vendorCode', label: 'Артикул WB', filterable: true, minWidth: '100px' },
  { key: 'marketplaceName', label: 'Название на WB', filterable: true, minWidth: '180px' },
  { key: 'size', label: 'Размер', filterable: true, width: '70px' },
  { key: 'barcodes', label: 'Штрихкоды', filterable: true, minWidth: '110px' },
  { key: 'linkedIdName', label: 'Связь WMS', minWidth: '220px' },
  { key: 'isActive', label: 'В продаже', width: '120px' }
]

const switchTab = (tab: 'ozon' | 'wb') => {
  activeTab.value = tab
  dataPageRef.value?.clearFilters()
  fetchData()
}
const fetchData = () => run(async () => {
  warehouseCards.value = await productService.getProducts()
  if (activeTab.value === 'ozon') ozonProducts.value = await productService.getOzonProducts()
  else wbProducts.value = await productService.getWbProducts()
})

const filteredWarehouseCards = computed(() => {
  const q = targetSearchQuery.value.toLowerCase().trim()
  return warehouseCards.value.filter(c => (c.cArt || '').toLowerCase().includes(q) || (c.cName || '').toLowerCase().includes(q) || String(c.idName).includes(q)).slice(0, 15)
})

const handleSync = async () => {
  isSyncing.value = true
  try { const res = await productService.syncMarketplaces(); toast.success(res.message); setTimeout(fetchData, 3000) }
  catch (err: unknown) {
    const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Ошибка'
    toast.error(errorMsg)
  }
  finally { isSyncing.value = false }
}

const toggleActive = async (item: OzonProduct | WbProduct) => {
  try {
    const newStatus = !item.isActive
    if (activeTab.value === 'ozon') await productService.toggleOzonActive({ idOzonProduct: (item as OzonProduct).idOzonProduct, isActive: newStatus })
    else await productService.toggleWbActive({ idChrt: (item as WbProduct).idChrt, isActive: newStatus })
    item.isActive = newStatus; toast.success(newStatus ? 'Товар в продаже' : 'Товар в стоп-листе')
  } catch { toast.error('Ошибка изменения статуса') }
}

const selectedWarehouseCard = computed(() => warehouseCards.value.find(c => c.idName === targetIdName.value))
const openLinkModal = (item: OzonProduct | WbProduct) => {
  selectedMarketplaceProduct.value = item; targetIdName.value = item.linkedIdName; targetSearchQuery.value = ''; isTargetDropdownOpen.value = false; isLinkModalOpen.value = true
}
const selectTarget = (card: Product | null) => { targetIdName.value = card ? card.idName : null; isTargetDropdownOpen.value = false }

const saveLink = async () => {
  if (!selectedMarketplaceProduct.value) return
  isSaving.value = true
  try {
    if (activeTab.value === 'ozon') await productService.linkOzonProduct({ idOzonProduct: (selectedMarketplaceProduct.value as OzonProduct).idOzonProduct, newIdName: targetIdName.value })
    else await productService.linkWbProduct({ idChrt: (selectedMarketplaceProduct.value as WbProduct).idChrt, newIdName: targetIdName.value })
    toast.success('Привязка обновлена!'); isLinkModalOpen.value = false; fetchData()
  } catch { toast.error('Ошибка') } finally { isSaving.value = false }
}

const handleClickOutside = (e: MouseEvent) => { if (targetAutocompleteRef.value && !targetAutocompleteRef.value.contains(e.target as Node)) isTargetDropdownOpen.value = false }

onMounted(() => { fetchData(); document.addEventListener('click', handleClickOutside) })
onUnmounted(() => document.removeEventListener('click', handleClickOutside))
</script>

<style scoped>
.autocomplete-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.autocomplete-list {
  display: flex;
  flex-direction: column;
  background: var(--color-surface);
  border: 1px solid var(--color-border-dark);
  border-radius: var(--radius-8);
  max-height: 240px;
  overflow-y: auto;
  scrollbar-width: thin;
  box-shadow: var(--shadow-sm);
}

.autocomplete-item {
  padding: 10px 14px;
  cursor: pointer;
  display: flex;
  gap: 12px;
  font-size: 13px;
  align-items: center;
  border-bottom: 1px solid var(--color-border-subtle);
  transition: background 0.15s ease;
  color: var(--color-text-primary);
}

.autocomplete-item:last-child {
  border-bottom: none;
}

.autocomplete-item:hover {
  background: var(--color-background-secondary);
}
</style>
