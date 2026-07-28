<template>
  <BaseModal :is-open="isOpen" max-width="5xl" @update:is-open="close">
    <template #header>
      <div class="flex items-center justify-between w-full pr-16">
        <div class="flex items-center gap-12">
          <span class="badge badge--warning text-xs">Стоп-лист</span>
          <h3 class="m-0 text-lg font-bold text-primary">Управление продажами (WB / OZON)</h3>
        </div>

        <!-- КНОПКА ВЫЗОВА EXCEL ИМПОРТА В ЕДИНОМ СТИЛЕ -->
        <button
          class="btn btn-secondary btn-xs flex items-center gap-8 border-dark"
          @click="isExcelModalOpen = true"
        >
          <img src="@/components/icons/office-exel.svg" alt="Excel" width="14" height="14" />
          <span>Импорт из Excel</span>
        </button>
      </div>
    </template>

    <div class="flex flex-col gap-16 py-8">
      <!-- Панель со статистикой и пакетными кнопками -->
      <div class="flex items-center justify-between gap-12 bg-secondary p-12 rounded-8 border-dark">
        <span class="text-xs text-muted">
          Всего позиций: <strong>{{ stopList.length }}</strong> | В продаже:
          <strong class="text-success">{{ activeCount }}</strong>
        </span>

        <div class="flex items-center gap-8 shrink-0">
          <button
            class="btn btn-xs btn-success-soft"
            :disabled="isSaving || !stopList.length"
            @click="toggleBulk(true)"
          >
            ✓ Включить все (1)
          </button>
          <button
            class="btn btn-xs btn-danger-soft"
            :disabled="isSaving || !stopList.length"
            @click="toggleBulk(false)"
          >
            🚫 Выключить все (0)
          </button>
        </div>
      </div>

      <!-- Таблица каталога через готовый SharedProductTable -->
      <div class="card no-padding overflow-hidden border border-dark">
        <SharedProductTable
          :items="stopList as never[]"
          :loading="loading"
          max-height="420px"
          :hide-columns="['irQuant', 'iBronTask', 'defectQuant']"
          :extra-columns="extraCols"
        >
          <!-- Переключатель активности в колонке -->
          <template #cell(isActive)="{ item }: { item: StopListItem }">
            <div class="flex justify-center">
              <button
                :class="[
                  'badge cursor-pointer select-none transition-all py-4 px-10 text-xs font-bold border',
                  item.isActive
                    ? 'badge--success border-success/30 hover:bg-success/20'
                    : 'badge--error border-error/30 hover:bg-error/20',
                ]"
                :disabled="isSaving"
                @click.stop="toggleSingle(item)"
              >
                {{ item.isActive ? 'В продаже (1)' : 'Заблокирован (0)' }}
              </button>
            </div>
          </template>
        </SharedProductTable>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end">
        <button type="button" class="btn btn-secondary" @click="close">Закрыть</button>
      </div>
    </template>

    <!-- МОДАЛКА EXCEL ИМПОРТА -->
    <BaseDialog v-model:is-open="isExcelModalOpen" variant="modal" max-width="2xl">
      <template #header>
        <h2 class="text-xl font-bold m-0">Массовый импорт Стоп-листа</h2>
      </template>
      <StopListBulkImportModal
        v-if="isExcelModalOpen"
        :catalog-stop-list="stopList"
        @close="isExcelModalOpen = false"
        @updated="fetchStopList"
      />
    </BaseDialog>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import BaseModal from '@/components/ui/UnifiedUI.vue'
import BaseDialog from '@/components/ui/UnifiedUI.vue'
import SharedProductTable from '@/components/ui/CatalogTable.vue'
import StopListBulkImportModal from '@/components/modals/StopListBulkImportModal.vue'
import { cardsService, type StopListItem } from '@/api/cardsService'
import { useToast } from '@/composables/useToast'
import type { TableColumn } from '@/components/ui/BaseTable.vue'

const props = defineProps<{ isOpen: boolean }>()
const emit = defineEmits<{ 'update:isOpen': [value: boolean] }>()

const toast = useToast()
const loading = ref(false)
const isSaving = ref(false)
const isExcelModalOpen = ref(false)
const stopList = ref<StopListItem[]>([])

// Колонка статуса
const extraCols: TableColumn<unknown>[] = [
  { key: 'isActive', label: 'Статус продажи', minWidth: '140px' },
]

const close = () => emit('update:isOpen', false)

const fetchStopList = async () => {
  loading.value = true
  try {
    stopList.value = await cardsService.getStopList()
  } catch {
    toast.error('Не удалось загрузить Стоп-лист')
  } finally {
    loading.value = false
  }
}

watch(
  () => props.isOpen,
  (open) => {
    if (open) fetchStopList()
  },
)

const activeCount = computed(() => stopList.value.filter((i) => i.isActive).length)

// Переключение одного товара
const toggleSingle = async (item: StopListItem) => {
  const nextState = !item.isActive
  isSaving.value = true

  try {
    await cardsService.updateStopList({
      idNames: [item.idName],
      isActive: nextState,
    })
    item.isActive = nextState
    toast.success(nextState ? 'Товар включен в продажу' : 'Товар снят с продажи')
  } catch {
    toast.error('Не удалось обновить статус')
  } finally {
    isSaving.value = false
  }
}

// Пакетное переключение всех товаров
const toggleBulk = async (isActive: boolean) => {
  if (!stopList.value.length) return

  const targetIds = stopList.value.map((i) => i.idName)
  isSaving.value = true

  try {
    await cardsService.updateStopList({
      idNames: targetIds,
      isActive,
    })

    stopList.value.forEach((i) => (i.isActive = isActive))
    toast.success(`Обновлен статус для ${targetIds.length} товаров`)
  } catch {
    toast.error('Ошибка при пакетном обновлении')
  } finally {
    isSaving.value = false
  }
}
</script>
