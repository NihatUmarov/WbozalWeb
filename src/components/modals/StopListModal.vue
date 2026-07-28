<template>
  <BaseModal :is-open="isOpen" max-width="5xl" @update:is-open="close">
    <template #header>
      <div class="flex items-center justify-between w-full pr-16">
        <div class="flex items-center gap-12">
          <AppBadge variant="warning" text="Стоп-лист" />
          <h3 class="m-0 text-lg font-bold text-primary">Управление продажами (WB / OZON)</h3>
        </div>
        <button class="btn btn-secondary btn-xs flex items-center gap-8 border-dark" @click="isExcelModalOpen = true">
          <img src="@/components/icons/office-exel.svg" alt="Excel" width="14" height="14" />
          <span>Импорт из Excel</span>
        </button>
      </div>
    </template>

    <div class="flex flex-col gap-16 py-8">
      <div class="flex items-center justify-between gap-12 bg-secondary p-12 rounded-8 border-dark">
        <span class="text-xs text-muted">
          Всего позиций: <strong>{{ stopList.length }}</strong> | В продаже: <strong class="text-success">{{ activeCount }}</strong>
        </span>
        <div class="flex items-center gap-8 shrink-0">
          <button class="btn btn-xs btn-success-soft" :disabled="isSaving || !stopList.length" @click="toggleBulk(true)">✓ Включить все</button>
          <button class="btn btn-xs btn-danger-soft" :disabled="isSaving || !stopList.length" @click="toggleBulk(false)">🚫 Выключить все</button>
        </div>
      </div>

      <div class="card no-padding overflow-hidden border border-dark">
        <SharedProductTable :items="stopList as unknown as never[]" :loading="loading" max-height="420px" :hide-columns="['irQuant', 'iBronTask', 'defectQuant']" :extra-columns="extraCols">
          <template #cell(isActive)="{ item }: { item: StopListItem }">
            <div class="flex justify-center">
              <button class="badge-btn-wrapper" :disabled="isSaving" @click.stop="toggleSingle(item)">
                <AppBadge :variant="item.isActive ? 'success' : 'error'" :text="item.isActive ? 'В продаже (1)' : 'Заблокирован (0)'" class="cursor-pointer" />
              </button>
            </div>
          </template>
        </SharedProductTable>
      </div>
    </div>

    <template #footer>
      <button type="button" class="btn btn-secondary" @click="close">Закрыть</button>
    </template>

    <BaseDialog v-model:is-open="isExcelModalOpen" variant="modal" max-width="2xl">
      <template #header><h2 class="text-xl font-bold m-0">Массовый импорт Стоп-листа</h2></template>
      <StopListBulkImportModal v-if="isExcelModalOpen" :catalog-stop-list="stopList" @close="isExcelModalOpen = false" @updated="fetchStopList" />
    </BaseDialog>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import BaseModal from '@/components/ui/UnifiedUI.vue'
import BaseDialog from '@/components/ui/UnifiedUI.vue'
import SharedProductTable from '@/components/ui/CatalogTable.vue'
import { AppBadge, type TableColumn } from '@/components/ui/BaseTable.vue'
import StopListBulkImportModal from '@/components/modals/StopListBulkImportModal.vue'
import { productService, type StopListItem } from '@/api/productService'
import { useToast } from '@/composables/useToast'

const props = defineProps<{ isOpen: boolean }>(); const emit = defineEmits<{ 'update:isOpen': [value: boolean] }>()
const toast = useToast(); const loading = ref(false); const isSaving = ref(false); const isExcelModalOpen = ref(false); const stopList = ref<StopListItem[]>([])
const extraCols: TableColumn<StopListItem>[] = [{ key: 'isActive', label: 'Статус продажи', minWidth: '140px' }]
const close = () => emit('update:isOpen', false)

const fetchStopList = async () => {
  loading.value = true
  try { stopList.value = await productService.getStopList() } catch { toast.error('Ошибка загрузки') } finally { loading.value = false }
}

watch(() => props.isOpen, (o) => { if (o) fetchStopList() })
const activeCount = computed(() => stopList.value.filter(i => i.isActive).length)

const toggleSingle = async (item: StopListItem) => {
  const next = !item.isActive; isSaving.value = true
  try {
    await productService.updateStopList({ idNames: [item.idName], isActive: next }); item.isActive = next; toast.success(next ? 'Включено' : 'Снято')
  } catch { toast.error('Ошибка') } finally { isSaving.value = false }
}

const toggleBulk = async (isActive: boolean) => {
  const ids = stopList.value.map(i => i.idName); isSaving.value = true
  try {
    await productService.updateStopList({ idNames: ids, isActive }); stopList.value.forEach(i => i.isActive = isActive); toast.success('Обновлено')
  } catch { toast.error('Ошибка') } finally { isSaving.value = false }
}
</script>

<style scoped>
.badge-btn-wrapper { background: none; border: none; padding: 0; cursor: pointer; display: inline-flex; }
.badge-btn-wrapper:disabled { cursor: not-allowed; opacity: 0.7; }
</style>
