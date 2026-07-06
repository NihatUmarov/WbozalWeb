<template>
  <BaseBottomSheet :is-open="isOpen" max-width="7xl" @update:is-open="close">
    <template #header>
      <div class="flex items-center gap-12">
        <span
          :class="[
            'badge',
            filterDefect && modelType === 'ORD' ? 'badge--error' : 'badge--success',
          ]"
        >
          {{ filterDefect && modelType === 'ORD' ? 'Брак' : 'Создание' }}
        </span>
        <h2 class="m-0 text-xl font-bold text-primary">
          {{
            modelType === 'FBO'
              ? 'Новый приход'
              : filterDefect
                ? 'Новая отгрузка брака'
                : 'Новая отгрузка'
          }}
        </h2>
      </div>
    </template>

    <div
      v-if="loading"
      class="flex flex-col items-center justify-center p-32 text-muted gap-12 py-40"
    >
      <div class="modal-spin-loader"></div>
      <p class="text-sm font-medium">Загружаем состав позиций...</p>
    </div>

    <div v-else class="flex flex-col gap-32 py-12">
      <section class="flex flex-col gap-16">
        <div class="pb-8 border-b">
          <h3 class="text-lg font-bold text-primary m-0">Основная информация</h3>
        </div>

        <div class="grid-3 gap-20">
          <div class="input-group">
            <label class="input-label text-muted font-medium text-xs mb-6 block">
              {{ modelType === 'FBO' ? 'Планируемая дата прихода' : 'Планируемая дата отгрузки' }}
            </label>
            <input v-model="formHeader.eventDate" type="date" class="input" />
          </div>

          <div v-if="modelType === 'ORD'" class="input-group">
            <label class="input-label text-muted font-medium text-xs mb-6 block"
              >Направление (Куда / Откуда)</label
            >
            <input
              v-model="formHeader.direction"
              type="text"
              placeholder="Коледино, Озон, г. Москва..."
              class="input"
            />
          </div>

          <div class="input-group" :class="{ 'col-span-2': modelType === 'FBO' }">
            <label class="input-label text-muted font-medium text-xs mb-6 block"
              >Техническое задание</label
            >
            <input
              v-model="formHeader.comment"
              type="text"
              placeholder="Дополнительная информация для склада..."
              class="input"
            />
          </div>
        </div>
      </section>

      <section class="flex flex-col gap-16">
        <div class="flex items-center justify-between gap-12 flex-wrap pb-8 border-b">
          <div class="flex items-center gap-16">
            <h3 class="text-lg font-bold text-primary m-0">Каталог товаров</h3>
            <span
              class="text-xs font-bold text-success bg-success-subtle border-success px-6 py-4 rounded-6 tabular-nums"
            >
              Добавлено: {{ addedItems.length }} поз. ({{ totalAddedQty }} шт.)
            </span>
            <button
              type="button"
              class="btn btn-secondary btn-xs flex items-center justify-center"
              :disabled="addedItems.length === 0"
              @click="showAddedItemsModal = true"
            >
              👁 Состав
            </button>
          </div>

          <div class="flex items-center gap-16">
            <div class="flex items-center gap-8">
              <button
                type="button"
                class="btn btn-secondary flex items-center gap-8"
                :disabled="loading"
                @click="triggerExcelInput"
              >
                <img
                  src="@/components/icons/office-exel.svg"
                  alt="Excel"
                  width="16"
                  height="16"
                  style="object-fit: contain"
                />
                <span>Загрузить из Excel</span>
              </button>

              <div class="info-tooltip-wrapper">
                <button type="button" class="info-trigger-btn">i</button>
                <div class="info-tooltip-content border-dark">
                  <h4 class="text-sm font-bold text-primary m-0 mb-6">Формат Excel файла:</h4>
                  <p class="text-xs text-muted m-0 mb-12 leading-relaxed">
                    Первый лист. Колонка A — Штрихкод, Колонка B — Количество.
                  </p>
                </div>
              </div>
            </div>

            <input
              type="file"
              ref="excelInputRef"
              accept=".xlsx, .xls"
              style="display: none"
              @change="onFileChange"
            />

            <div
              v-if="modelType === 'ORD'"
              class="flex items-center border border-dark rounded-6 p-4 bg-secondary"
            >
              <button
                type="button"
                class="btn btn-xs transition-all px-12"
                :class="!filterDefect ? 'btn-primary' : 'btn-secondary border-none'"
                style="height: 28px"
                @click="setShipmentMode(false)"
              >
                Стандартная
              </button>
              <button
                type="button"
                class="btn btn-xs transition-all px-12"
                :class="
                  filterDefect
                    ? 'btn-primary bg-error border-error text-white'
                    : 'btn-secondary border-none'
                "
                style="height: 28px"
                @click="setShipmentMode(true)"
              >
                Отгрузка брака
              </button>
            </div>
          </div>
        </div>

        <div class="w-full">
          <SharedProductTable
            :items="visibleCards"
            :loading="loading"
            max-height="450px"
            :hide-columns="['irQuant', 'iBronTask', 'defectQuant']"
            :extra-columns="createActionColumns"
          >
            <template #cell(stock)="{ item }: { item: any }">
              <span
                :class="[
                  'text-xs font-bold bg-success-subtle border-success px-6 py-4 rounded-6 tabular-nums',
                  calculateAvailableToShip(item) > 0
                    ? 'text-success'
                    : 'text-error bg-error-subtle border-error',
                ]"
              >
                {{ calculateAvailableToShip(item) }} шт.
              </span>
            </template>

            <template #cell(actions)="{ item }: { item: any }">
              <div class="flex items-center justify-end w-full">
                <input
                  type="number"
                  min="1"
                  :max="modelType === 'ORD' ? calculateAvailableToShip(item) : undefined"
                  placeholder="Кол-во"
                  class="input text-center font-semibold"
                  style="width: 85px; height: 28px; padding: 0 4px"
                  :disabled="modelType === 'ORD' && calculateAvailableToShip(item) <= 0"
                  v-model.number="inputAmounts[item.idName]"
                  @keydown.enter="handleInputCommit(item)"
                  @blur="handleInputCommit(item)"
                />
              </div>
            </template>
          </SharedProductTable>
        </div>
      </section>
    </div>

    <template #footer>
      <button
        class="btn btn-primary"
        :disabled="isSaving || addedItems.length === 0"
        @click="submitDocument"
      >
        <span v-if="isSaving" class="btn-spinner"></span>
        <span v-else>Сохранить и отправить на склад</span>
      </button>
    </template>
  </BaseBottomSheet>

  <ExcelErrorsModal v-model:is-open="showErrorsModal" :errors="importErrors" />

  <DocumentCompositionModal
    v-model:is-open="showAddedItemsModal"
    v-model:items="addedItems"
    :available-cards="unifiedCardsForImport"
    :model-type="modelType"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive } from 'vue'
import { stockService } from '@/api/InvoiceService'
import { catalogService, type CatalogItem } from '@/api/catalogService'
import { useAsync } from '@/composables/useAsync'
import { useToast } from '@/composables/useToast'
import { useExcelImport, type LocalPosition } from '@/composables/useExcelImport'

import BaseBottomSheet from '@/components/ui/BaseBottomSheet.vue'
import SharedProductTable from '@/components/ui/SharedProductTable.vue'
import ExcelErrorsModal from '@/components/modals/ExcelErrorsModal.vue'
import DocumentCompositionModal from '@/components/modals/DocumentCompositionModal.vue'
import type { TableColumn } from '@/components/ui/BaseTable.vue'
import type { UnifiedProductItem } from '@/composables/useExcelImport'

// Вычисляемое свойство, которое на лету приводит CatalogItem к строгому UnifiedProductItem,
// заменяя возможные undefined в defectQuant на дефолтный 0.
const unifiedCardsForImport = computed<UnifiedProductItem[]>(() => {
  return availableCards.value.map((card) => ({
    idName: card.idName,
    cName: card.cName || 'Без названия',
    cArt: card.cArt || '—',
    size: card.size || '—',
    irQuant: card.irQuant || 0,
    iBronTask: card.iBronTask || 0,
    defectQuant: card.defectQuant ?? 0, // Убираем undefined, превращая в 0
    barcodes: card.barcodes || (card.barcode ? [card.barcode] : []),
    isDefect: card.isDefect ?? false,
    primaryImageURL: card.primaryImageURL,
  }))
})
const props = defineProps<{ isOpen: boolean; modelType: 'FBO' | 'ORD' }>()
const emit = defineEmits<{ 'update:isOpen': [value: boolean]; saved: [] }>()

const toast = useToast()
const inputAmounts = reactive<Record<number, number | string>>({})
const { loading, run: runLoadCards } = useAsync()
const { loading: isSaving, run: runSaveDoc } = useAsync()

const availableCards = ref<CatalogItem[]>([])
const addedItems = ref<LocalPosition[]>([])
const filterDefect = ref(false)
const formHeader = reactive({ phone: '', comment: '', eventDate: '', direction: '' })

const showAddedItemsModal = ref(false)
const showErrorsModal = ref(false)
const excelInputRef = ref<HTMLInputElement | null>(null)

const createActionColumns: TableColumn<CatalogItem>[] = [
  { key: 'stock' as keyof CatalogItem, label: 'Доступно', width: '120px' },
  { key: 'actions' as keyof CatalogItem, label: '', width: '110px' },
]

const triggerExcelInput = () => excelInputRef.value?.click()

const onFileChange = async (event: Event) => {
  const result = await handleExcelImport(event, addedItems.value)
  if (result) addedItems.value = result
  if (importErrors.value.length > 0) showErrorsModal.value = true
}

const visibleCards = computed(() => {
  return availableCards.value.filter((card) => {
    return !addedItems.value.some(
      (added) =>
        added.idName === card.idName &&
        (props.modelType !== 'ORD' || added.isDefect === card.isDefect),
    )
  })
})

const handleInputCommit = (card: CatalogItem) => {
  const value = inputAmounts[card.idName]
  if (value === undefined || value === '') return
  const qty = Number(value)
  if (isNaN(qty) || qty <= 0) {
    delete inputAmounts[card.idName]
    return toast.warning('Введите корректное число больше нуля')
  }
  quickAddProduct(card, qty)
  delete inputAmounts[card.idName]
}

const totalAddedQty = computed(() =>
  addedItems.value.reduce((sum, item) => sum + (item.qty || 0), 0),
)
const calculateAvailableToShip = (item: CatalogItem) =>
  Math.max(0, (item.irQuant ?? 0) - (item.iBronTask ?? 0))

const loadAvailableItems = () => {
  runLoadCards(
    async () => {
      if (props.modelType === 'ORD') {
        availableCards.value = await catalogService.getRemains(filterDefect.value)
      } else {
        availableCards.value = await catalogService.getCards()
      }
    },
    { toast, errorMessage: 'Не удалось загрузить данные товаров' },
  )
}

// Передаем строго типизированный computed вместо 'availableCards as any'
const { importErrors, handleExcelImport } = useExcelImport(
  unifiedCardsForImport,
  props.modelType,
  filterDefect,
)

const setShipmentMode = (isDefectMode: boolean) => {
  if (filterDefect.value === isDefectMode) return
  if (addedItems.value.length > 0) {
    addedItems.value = []
    toast.warning('Выбранные товары сброшены (изменен тип отгрузки)!')
  }
  filterDefect.value = isDefectMode
  loadAvailableItems()
}

const quickAddProduct = (card: CatalogItem, customQty = 1) => {
  if (customQty <= 0) return
  const limit = calculateAvailableToShip(card)
  if (props.modelType === 'ORD' && limit <= 0) return toast.warning('Товара нет в наличии!')

  const barcode = card.barcodes?.[0] || card.barcode || 'Без ШК'
  const existing = addedItems.value.find(
    (i) =>
      i.idName === card.idName &&
      i.barcode === barcode &&
      (props.modelType !== 'ORD' || i.isDefect === card.isDefect),
  )

  if (existing) {
    if (props.modelType === 'ORD' && existing.qty + customQty > limit)
      return toast.warning(`Лимит превышен. Доступно: ${limit} шт.`)
    existing.qty += customQty
  } else {
    if (props.modelType === 'ORD' && customQty > limit)
      return toast.warning(`Лимит превышен. Доступно: ${limit} шт.`)
    addedItems.value.push({
      idName: card.idName,
      barcode,
      qty: customQty,
      name: card.cName || 'Без названия',
      cArt: card.cArt || '—',
      size: card.size || '—',
      isDefect: props.modelType === 'ORD' ? card.isDefect : false,
      primaryImageURL: card.primaryImageURL,
    })
  }
  toast.info(`Добавлено: ${card.cArt} (${customQty} шт.)`)
}

const submitDocument = () => {
  if (addedItems.value.length === 0) return
  if (props.modelType === 'ORD') {
    for (const item of addedItems.value) {
      const card = availableCards.value.find((c) => c.idName === item.idName)
      if (card && item.qty > calculateAvailableToShip(card))
        return toast.error(`Превышен лимит по артикулу ${item.cArt}`)
    }
  }
  runSaveDoc(
    async () => {
      await stockService.createDocument({
        model: props.modelType,
        comment: formHeader.comment,
        phone: formHeader.phone,
        direction: props.modelType === 'ORD' ? formHeader.direction : '',
        eventDate: formHeader.eventDate ? new Date(formHeader.eventDate).toISOString() : null,
        items: addedItems.value.map(({ idName, barcode, qty, isDefect }) => ({
          idName,
          barcode,
          qty,
          ...(props.modelType === 'ORD' ? { isDefect } : {}),
        })),
      })
      emit('update:isOpen', false)
      emit('saved')
    },
    { toast, successMessage: 'Документ успешно зарегистрирован!' },
  )
}

watch(
  () => props.isOpen,
  (newVal) => {
    if (!newVal) return
    Object.assign(formHeader, { phone: '', comment: '', eventDate: '', direction: '' })
    addedItems.value = []
    Object.keys(inputAmounts).forEach((k) => delete inputAmounts[Number(k)])
    filterDefect.value = false
    showAddedItemsModal.value = false
    loadAvailableItems()
  },
)

const close = () => emit('update:isOpen', false)
</script>

<style scoped>
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  appearance: none;
  margin: 0;
}
input[type='number'] {
  -moz-appearance: textfield;
  appearance: textfield;
}
</style>
