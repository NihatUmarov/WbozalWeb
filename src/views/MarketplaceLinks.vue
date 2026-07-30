<template>
  <MainLayout>
    <BaseDataPage
      title="Интеграция с маркетплейсами"
      :items="activeTab === 'ozon' ? ozonProducts : wbProducts"
      :columns="activeTab === 'ozon' ? ozonColumns : wbColumns"
      :loading="loading"
      :tabs="[
        { label: 'Wildberries FBS', value: 'wb' },
        { label: 'OZON FBS', value: 'ozon' }
      ]"
      :current-tab="activeTab"
      @tab-change="switchTab($event as any)"
    >
      <template #header-actions>
        <div class="flex items-center gap-12">
          <button class="btn btn-warning flex items-center gap-8" @click="isStopListModalOpen = true">
            <span>🛑 Стоп-лист</span>
          </button>
          <button class="btn btn-primary flex items-center gap-8" :disabled="isSyncing" @click="handleSync">
            <span v-if="isSyncing" class="btn-spinner"></span>
            <span>Обновить из МП</span>
          </button>
        </div>
      </template>

      <template #default="{ registerTable }">
        <BaseTable
          :ref="registerTable"
          :items="activeTab === 'ozon' ? ozonProducts : wbProducts"
          :columns="activeTab === 'ozon' ? ozonColumns : wbColumns"
          :loading="loading"
          :row-height="80"
          @row-click="openLinkModal"
        >
          <!-- Unified Slots -->
          <template #cell(linkedIdName)="{ item }">
            <div class="flex flex-col min-w-0 gap-4" v-if="item.linkedIdName">
              <AppTableCell :value="item.linkedName" bold size="xs" />
              <AppTableCell :value="`ID: ${item.linkedIdName} | Арт: ${item.linkedArt}`" mono size="xs" color="muted" />
              <AppBadge v-if="item.isLinkedToKit" variant="info" text="Комплект" />
            </div>
            <AppBadge v-else variant="error" text="Не привязан" />
          </template>

          <template #cell(vendorCode)="{ value }">
            <AppTableCell :value="String(value)" mono size="xs" color="muted" bg="secondary" border :px="6" :py="4" />
          </template>

          <template #cell(sku)="{ value }">
            <AppTableCell :value="String(value)" mono size="xs" color="muted" bg="secondary" border :px="6" :py="4" />
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
            <Transition name="dropdown-fade">
              <div v-if="isTargetDropdownOpen && filteredWarehouseCards.length" class="autocomplete-dropdown">
                <div v-for="card in filteredWarehouseCards" :key="card.idName" class="autocomplete-item" @click="selectTarget(card)">
                  <AppTableCell :value="`[${card.cArt || '—'}]`" mono bold color="brand" />
                  <span class="flex-1 truncate">{{ card.cName || 'Без названия' }}</span>
                  <AppBadge v-if="card.isKit" variant="info" text="Комплект" />
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </div>
      <template #footer>
        <button class="btn btn-secondary" @click="isLinkModalOpen = false">Отмена</button>
        <button class="btn btn-primary" :disabled="isSaving" @click="saveLink">
          <span v-if="isSaving" class="btn-spinner"></span>
          <span v-else>Сохранить связь</span>
        </button>
      </template>
    </BaseDialog>

    <StopListModal v-model:is-open="isStopListModalOpen" />
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import BaseDataPage from '@/components/ui/BaseDataPage.vue'
import BaseTable, { AppBadge, AppTableCell, type TableColumn } from '@/components/ui/BaseTable.vue'
import BaseDialog from '@/components/ui/UnifiedUI.vue'
import StopListModal from '@/components/modals/StopListModal.vue'
import { productService, type OzonProduct, type WbProduct } from '@/api/productService'
import type { Product } from '@/api/types'
import { useAsync } from '@/composables/useAsync'
import { useToast } from '@/composables/useToast'

const toast = useToast(); const { loading, run } = useAsync(); const isSaving = ref(false)
const activeTab = ref<'ozon' | 'wb'>('wb'); const ozonProducts = ref<OzonProduct[]>([]); const wbProducts = ref<WbProduct[]>([]); const warehouseCards = ref<Product[]>([])
const isLinkModalOpen = ref(false); const isStopListModalOpen = ref(false); const selectedMarketplaceProduct = ref<OzonProduct | WbProduct | null>(null); const targetIdName = ref<number | null>(null)
const targetSearchQuery = ref(''); const isTargetDropdownOpen = ref(false); const targetAutocompleteRef = ref<HTMLElement | null>(null); const isSyncing = ref(false)

const ozonColumns: TableColumn<OzonProduct>[] = [
  { key: 'marking', label: 'Артикул Ozon', filterable: true, minWidth: '120px' },
  { key: 'sku', label: 'SKU / Код', filterable: true, minWidth: '100px' },
  { key: 'marketplaceName', label: 'Название на Ozon', filterable: true, minWidth: '200px' },
  { key: 'linkedIdName', label: 'Связь WMS', minWidth: '220px' },
]

const wbColumns: TableColumn<WbProduct>[] = [
  { key: 'vendorCode', label: 'Артикул WB', filterable: true, minWidth: '120px' },
  { key: 'marketplaceName', label: 'Название на WB', filterable: true, minWidth: '200px' },
  { key: 'linkedIdName', label: 'Связь WMS', minWidth: '220px' },
]

const switchTab = (tab: 'ozon' | 'wb') => { activeTab.value = tab; fetchData() }
const fetchData = () => run(async () => {
  warehouseCards.value = await productService.getProducts()
  activeTab.value === 'ozon' ? ozonProducts.value = await productService.getOzonProducts() : wbProducts.value = await productService.getWbProducts()
})

const filteredWarehouseCards = computed(() => {
  const q = targetSearchQuery.value.toLowerCase().trim()
  return warehouseCards.value.filter(c => (c.cArt || '').toLowerCase().includes(q) || (c.cName || '').toLowerCase().includes(q) || String(c.idName).includes(q)).slice(0, 15)
})

const handleSync = async () => {
  isSyncing.value = true
  try {
    const res = await productService.syncMarketplaces()
    toast.success(res.message); setTimeout(fetchData, 3000)
  } catch (err: unknown) {
    const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Ошибка'
    toast.error(errorMsg)
  } finally { isSyncing.value = false }
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
    if (activeTab.value === 'ozon') {
      await productService.linkOzonProduct({ idOzonProduct: (selectedMarketplaceProduct.value as OzonProduct).idOzonProduct, newIdName: targetIdName.value })
    } else {
      await productService.linkWbProduct({ idChrt: (selectedMarketplaceProduct.value as WbProduct).idChrt, newIdName: targetIdName.value })
    }
    toast.success('Привязка обновлена!'); isLinkModalOpen.value = false; fetchData()
  } catch { toast.error('Ошибка') } finally { isSaving.value = false }
}

const handleClickOutside = (e: MouseEvent) => {
  if (targetAutocompleteRef.value && !targetAutocompleteRef.value.contains(e.target as Node)) isTargetDropdownOpen.value = false
}

onMounted(() => { fetchData(); document.addEventListener('click', handleClickOutside) })
onUnmounted(() => document.removeEventListener('click', handleClickOutside))
</script>

<style scoped>
.autocomplete-wrapper { position: relative; width: 100%; display: flex; flex-direction: column; }
.autocomplete-dropdown { position: absolute; top: 100%; left: 0; right: 0; background: var(--color-surface); border: 1px solid var(--color-border-dark); border-radius: 8px; max-height: 180px; overflow-y: auto; z-index: 50; box-shadow: var(--shadow-sm); margin-top: 4px; }
.autocomplete-item { padding: 10px 16px; cursor: pointer; display: flex; gap: 12px; font-size: 13px; align-items: center; transition: background 0.2s; color: var(--color-text-primary); }
.autocomplete-item:hover { background: var(--color-background-secondary); }
</style>
