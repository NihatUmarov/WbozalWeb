<template>
  <BaseModal :is-open="isOpen" variant="sheet" max-width="7xl" @update:is-open="close">
    <template #header>
      <div class="flex items-center gap-12">
        <AppBadge
          :variant="filterDefect && modelType === 'ORD' ? 'error' : 'success'"
          :text="filterDefect && modelType === 'ORD' ? 'Брак' : 'Создание'"
        />
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

    <div v-else class="flex flex-col gap-24 py-12">
      <section class="w-full">
        <InvoiceHeaderFields v-model="formHeader" :model-type="modelType" />
      </section>

      <section class="flex flex-col gap-16">
        <div class="flex items-center justify-between gap-12 flex-wrap pb-8 border-b">
          <div class="flex items-center gap-16">
            <h3 class="text-lg font-bold text-primary m-0">Каталог товаров</h3>
            <AppBadge variant="success" :text="`Добавлено: ${addedItems.length} поз. (${totalAddedQty} шт.)`" />
            <button
              type="button"
              class="btn btn-secondary btn-sm flex items-center justify-center"
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
                <img src="@/components/icons/office-exel.svg" alt="Excel" width="16" height="16" />
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
              class="flex items-center border border-dark rounded-10 p-6 bg-secondary"
            >
              <button
                type="button"
                class="btn btn-sm transition-all px-16 h-40"
                :class="!filterDefect ? 'btn-primary' : 'btn-secondary border-none'"
                @click="setShipmentMode(false)"
              >
                Стандартная
              </button>
              <button
                type="button"
                class="btn btn-sm transition-all px-16 h-40"
                :class="
                  filterDefect
                    ? 'btn-primary bg-error border-error text-white'
                    : 'btn-secondary border-none'
                "
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
            <template #cell(stock)="{ item }: { item: Product }">
              <div class="flex justify-center">
                <AppBadge
                  :variant="calculateAvailableToShip(item) > 0 ? 'success' : 'error'"
                  :text="formatQuantity(calculateAvailableToShip(item))"
                />
              </div>
            </template>

            <template #cell(actions)="{ item }: { item: Product }">
              <div class="flex items-center justify-end gap-15 w-full">
                <div v-if="modelType === 'FBO' && item.barcodes?.length > 1" class="flex flex-col items-start gap-6">
                  <span class="text-xs text-muted font-medium">Штрихкод</span>
                  <select
                    class="input text-sm"
                    style="width: 160px; height: 44px; padding: 0 10px"
                    v-model="inputBarcodes[item.idName]"
                  >
                    <option v-for="bc in item.barcodes" :key="bc" :value="bc">{{ bc }}</option>
                  </select>
                </div>

                <div v-if="modelType === 'FBO'" class="flex flex-col items-start gap-6">
                  <span class="text-xs text-muted font-medium">Срок годности</span>
                  <input
                    type="date"
                    class="input text-sm"
                    style="width: 160px; height: 44px; padding: 0 10px"
                    v-model="inputExpirations[item.idName]"
                  />
                </div>

                <div class="flex flex-col items-start gap-6">
                  <span v-if="modelType === 'FBO'" class="text-xs text-muted font-medium">Кол-во</span>
                  <input
                    type="number"
                    min="1"
                    :max="modelType === 'ORD' ? calculateAvailableToShip(item) : undefined"
                    placeholder="Кол-во"
                    class="input text-center font-bold"
                    style="width: 100px; height: 44px; padding: 0 8px"
                    :disabled="modelType === 'ORD' && calculateAvailableToShip(item) <= 0"
                    v-model.number="inputAmounts[item.idName]"
                    @keydown.enter="handleInputCommit(item)"
                    @blur="handleInputCommit(item)"
                  />
                </div>
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
  </BaseModal>

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
import { productService } from '@/api/productService'
import { useAsync } from '@/composables/useAsync'
import { useToast } from '@/composables/useToast'
import { useExcelImport, type LocalPosition } from '@/composables/useExcelImport'
import { formatQuantity } from '@/utils/formatters'
import InvoiceHeaderFields from '@/components/ui/InvoiceHeaderForm.vue'
import SharedProductTable from '@/components/ui/CatalogTable.vue'
import ExcelErrorsModal from '@/components/modals/ExcelErrorsModal.vue'
import DocumentCompositionModal from '@/components/modals/DocumentCompositionModal.vue'
import { AppBadge, type TableColumn } from '@/components/ui/BaseTable.vue'
import type { UnifiedProductItem } from '@/composables/useExcelImport'
import type { Product } from '@/api/types'
import BaseModal from '@/components/ui/UnifiedUI.vue'

const props = defineProps<{ isOpen: boolean; modelType: 'FBO' | 'ORD' }>()
const emit = defineEmits<{ 'update:isOpen': [value: boolean]; saved: [] }>()

const toast = useToast()
const inputAmounts = reactive<Record<number, number | string>>({})
const inputExpirations = reactive<Record<number, string>>({})
const inputBarcodes = reactive<Record<number, string>>({})
const { loading, run: runLoadCards } = useAsync()
const { loading: isSaving, run: runSaveDoc } = useAsync()

const availableCards = ref<Product[]>([])
const addedItems = ref<LocalPosition[]>([])
const filterDefect = ref(false)
const formHeader = reactive({ phone: '', comment: '', eventDate: '', direction: '' })

const showAddedItemsModal = ref(false)
const showErrorsModal = ref(false)
const excelInputRef = ref<HTMLInputElement | null>(null)

const unifiedCardsForImport = computed<UnifiedProductItem[]>(() => {
  return availableCards.value.map((card) => ({
    ...card,
    cName: card.cName || 'Без названия',
    cArt: card.cArt || '—',
    size: card.size || '—',
  }))
})

const createActionColumns = computed<TableColumn<Product>[]>(() => {
  return [
    { key: 'stock', label: 'Доступно', width: '120px' },
    {
      key: 'actions',
      label: '',
      width: props.modelType === 'FBO' ? '400px' : '110px',
    },
  ]
})

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

const handleInputCommit = (card: Product) => {
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
const calculateAvailableToShip = (item: Product) =>
  Math.max(0, (item.irQuant ?? 0) - (item.iBronTask ?? 0))

const loadAvailableItems = () => {
  runLoadCards(
    async () => {
      let data: Product[] = []
      if (props.modelType === 'ORD') {
        data = await productService.getRemains(filterDefect.value)
      } else {
        data = await productService.getProducts()
      }
      availableCards.value = data

      // Инициализируем штрихкоды по умолчанию для FBO
      if (props.modelType === 'FBO') {
        data.forEach(card => {
          if (card.barcodes?.length > 1 && !inputBarcodes[card.idName]) {
            inputBarcodes[card.idName] = card.barcodes[0]
          }
        })
      }
    },
    { toast, errorMessage: 'Не удалось загрузить данные товаров' },
  )
}

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

const quickAddProduct = (card: Product, customQty = 1) => {
  if (customQty <= 0) return
  const limit = calculateAvailableToShip(card)
  if (props.modelType === 'ORD' && limit <= 0) return toast.warning('Товара нет в наличии!')

  const barcode = inputBarcodes[card.idName] || card.barcodes?.[0] || (card as Product & { barcode?: string }).barcode || 'Без ШК'
  const selectedExpDate = inputExpirations[card.idName] || null
  const conflictingItem = addedItems.value.find(
    (item) => item.barcode === barcode && item.expirationDate !== selectedExpDate,
  )

  if (conflictingItem) {
    const existingDateText = conflictingItem.expirationDate || 'Без срока'
    return toast.error(
      `Ошибка! Для штрихкода ${barcode} уже задан срок годности: ${existingDateText}.`,
    )
  }

  const existing = addedItems.value.find(
    (i) =>
      i.idName === card.idName &&
      i.barcode === barcode &&
      i.expirationDate === selectedExpDate &&
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
      expirationDate: selectedExpDate,
    })
  }

  delete inputExpirations[card.idName]
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
        items: addedItems.value.map(({ idName, barcode, qty, isDefect, expirationDate }) => ({
          idName,
          barcode,
          qty,
          expirationDate,
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
    Object.keys(inputExpirations).forEach((k) => delete inputExpirations[Number(k)])
    Object.keys(inputBarcodes).forEach((k) => delete inputBarcodes[Number(k)])
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
