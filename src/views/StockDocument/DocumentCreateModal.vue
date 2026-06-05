<template>
  <BaseBottomSheet :is-open="isOpen" max-width="7xl" @update:is-open="close">
    <template #header>
      <div class="flex items-center gap-12">
        <span class="badge badge--success">Создание</span>
        <h2 class="m-0 text-2xl font-bold text-primary">
          {{ modelType === 'FBO' ? 'Новый приход' : 'Новая отгрузка' }}
        </h2>
      </div>
    </template>

    <div class="flex flex-col gap-32 py-12">
      <section class="flex flex-col gap-16">
        <div class="pb-8 border-b">
          <h3 class="text-lg font-bold text-primary m-0">Основная информация</h3>
        </div>

        <div class="grid-2-cols gap-20">
          <div class="input-group">
            <label class="input-label text-muted font-medium text-xs mb-6 block"
              >Телефон контактного лица</label
            >
            <input
              v-model="formHeader.phone"
              type="text"
              placeholder="+7 (999) 000-00-00"
              class="input"
            />
          </div>
          <div class="input-group">
            <label class="input-label text-muted font-medium text-xs mb-6 block">
              {{ modelType === 'FBO' ? 'Планируемая дата прихода' : 'Планируемая дата отгрузки' }}
            </label>
            <input v-model="formHeader.eventDate" type="date" class="input" />
          </div>
        </div>

        <div class="grid-2-cols gap-20">
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
              >Комментарий к документу</label
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
          <h3 class="text-lg font-bold text-primary m-0">
            Каталог товаров
            <span class="text-sm font-normal text-muted lowercase"
              >(Используйте фильтры для быстрого поиска)</span
            >
          </h3>

          <label v-if="modelType === 'ORD'" class="toggle toggle-defect">
            <input type="checkbox" v-model="filterDefect" @change="loadAvailableItems" />
            <div class="toggle-track"></div>
            <span class="text-xs font-medium text-primary">Показать только брак</span>
          </label>
        </div>

        <div class="w-full">
          <BaseTable
            :items="availableCards"
            :columns="catalogColumns"
            max-height="280px"
            :loading="loading"
          >
            <template #cell(cArt)="{ item }">
              <span
                class="font-mono text-xs font-semibold text-primary bg-secondary border-dark px-6 py-4 rounded-6"
              >
                {{ item.cArt || '—' }}
              </span>
            </template>

            <template #cell(cName)="{ item }">
              <div class="flex flex-col min-w-0">
                <span
                  class="text-sm font-semibold text-primary truncate max-w-md"
                  :title="String(item.cName || '')"
                >
                  {{ item.cName || 'Без названия' }}
                </span>
                <span class="text-xs text-muted font-mono mt-4">ID: {{ item.idName }}</span>
              </div>
            </template>

            <template #cell(barcodes)="{ item }">
              <span
                class="font-mono text-xs text-muted bg-secondary border-dark px-6 py-4 rounded-6 tracking-wide"
              >
                {{ item.barcodes?.[0] || '—' }}
              </span>
            </template>

            <template #cell(stock)="{ item }">
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

            <template #cell(isDefect)="{ value }">
              <span :class="['badge', value ? 'badge--error' : 'badge--success']">
                {{ value ? 'Брак' : 'Исправен' }}
              </span>
            </template>

            <template #cell(actions)="{ item }">
              <button
                class="btn table-add-btn"
                :class="
                  modelType === 'ORD' && calculateAvailableToShip(item) <= 0
                    ? 'btn-secondary'
                    : 'btn-primary'
                "
                :disabled="modelType === 'ORD' && calculateAvailableToShip(item) <= 0"
                @click="quickAddProduct(item)"
              >
                Добавить
              </button>
            </template>
          </BaseTable>
        </div>
      </section>

      <section class="flex flex-col gap-16">
        <div class="pb-8 border-b">
          <h3 class="text-lg font-bold text-primary m-0">
            Позиций к добавлению в документ ({{ addedItems.length }})
          </h3>
        </div>

        <div class="added-items-table-wrapper border-dark w-full">
          <BaseTable :items="addedItems" :columns="addedItemsColumns">
            <template #cell(product)="{ item }">
              <div class="flex flex-col min-w-0 gap-4 items-start">
                <span
                  class="text-sm font-semibold text-primary truncate max-w-md"
                  :title="item.name"
                >
                  {{ item.name }}
                </span>
                <div class="flex items-center gap-6">
                  <span
                    class="font-mono text-[10px] font-semibold text-primary bg-secondary border-dark px-6 py-2 rounded-6"
                  >
                    {{ item.cArt }}
                  </span>
                  <span v-if="item.isDefect" class="badge badge--error text-[10px] py-0 px-4"
                    >Брак</span
                  >
                </div>
              </div>
            </template>

            <template #cell(barcode)="{ value }">
              <span
                class="font-mono text-xs text-muted bg-secondary border-dark px-6 py-4 rounded-6 tracking-wide"
              >
                {{ value }}
              </span>
            </template>

            <template #cell(qty)="{ item }">
              <div class="flex items-center gap-8">
                <input
                  type="number"
                  v-model.number="item.qty"
                  min="1"
                  class="custom-table-qty"
                  @change="validateInputQty(item)"
                />
                <span class="text-xs font-semibold text-muted">шт.</span>
              </div>
            </template>

            <template #cell(actions)="{ item }">
              <button
                class="table-row-delete-btn"
                title="Удалить позицию"
                @click="removePosition(item)"
              >
                ✕
              </button>
            </template>
          </BaseTable>

          <div
            v-if="addedItems.length === 0"
            class="empty-placeholder text-muted text-sm font-medium"
          >
            Вы пока не добавили ни одного товара из каталога выше
          </div>
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
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive } from 'vue'
import { stockService } from '@/api/stockService'
import { cardsService } from '@/api/cardsService'
import { remainsService } from '@/api/remainsService'
import { useAsync } from '@/composables/useAsync'
import type { CardItem, RemainItem } from '@/api/types'
import BaseBottomSheet from '@/components/ui/BaseBottomSheet.vue'
import BaseTable, { type TableColumn } from '@/components/ui/BaseTable.vue'

export interface ToastInstance {
  show(message: string, type?: 'success' | 'error' | 'warning' | 'info', duration?: number): void
}

const props = defineProps<{
  isOpen: boolean
  modelType: 'FBO' | 'ORD'
  toast: ToastInstance | null
}>()

const emit = defineEmits<{
  'update:isOpen': [value: boolean]
  saved: []
}>()

interface UnifiedProductItem {
  idName: number
  cName: string | null
  cArt: string | null
  irQuant: number
  iBronTask: number
  defectQuant: number
  barcodes: string[]
  isDefect?: boolean
}

const availableCards = ref<UnifiedProductItem[]>([])
const filterDefect = ref(false)

interface LocalPosition {
  idName: number
  barcode: string
  qty: number
  cArt: string
  name: string
  isDefect?: boolean
}
const addedItems = ref<LocalPosition[]>([])
const formHeader = reactive({ phone: '', comment: '', eventDate: '', direction: '' })

const { loading, run: runLoadCards } = useAsync()
const { loading: isSaving, run: runSaveDoc } = useAsync()

const catalogColumns = computed<TableColumn<UnifiedProductItem>[]>(() => {
  const cols: TableColumn<UnifiedProductItem>[] = [
    { key: 'cArt', label: 'Артикул', sortable: true, filterable: true, width: '130px' },
    { key: 'cName', label: 'Название товара', sortable: true, filterable: true, minWidth: '240px' },
    { key: 'barcodes', label: 'Штрихкод', filterable: true, width: '150px' },
    { key: 'stock' as keyof UnifiedProductItem, label: 'Доступно', width: '120px' },
  ]
  if (props.modelType === 'ORD') {
    cols.push({ key: 'isDefect', label: 'Состояние', sortable: true, width: '120px' })
  }
  cols.push({ key: 'actions' as keyof UnifiedProductItem, label: '', width: '100px' })
  return cols
})

const addedItemsColumns = computed<TableColumn<LocalPosition>[]>(() => [
  { key: 'product' as keyof LocalPosition, label: 'Товар', minWidth: '300px' },
  { key: 'barcode', label: 'Штрихкод', width: '160px' },
  { key: 'qty', label: 'Количество к оформлению', width: '180px' },
  { key: 'actions' as keyof LocalPosition, label: '', width: '50px' },
])

const calculateAvailableToShip = (item: UnifiedProductItem) => {
  const diff = (item.irQuant ?? 0) - (item.iBronTask ?? 0)
  return diff > 0 ? diff : 0
}

const loadAvailableItems = () => {
  runLoadCards(
    async () => {
      if (props.modelType === 'ORD') {
        const data = await remainsService.getRemains(filterDefect.value)
        availableCards.value = data.map((item: RemainItem): UnifiedProductItem => {
          const barcodesArray =
            'barcodes' in item && Array.isArray((item as Record<string, unknown>).barcodes)
              ? ((item as Record<string, unknown>).barcodes as string[])
              : [item.barcode || '']
          return {
            idName: item.idName ?? 0,
            cName: item.cName,
            cArt: item.cArt,
            irQuant: item.irQuant ?? 0,
            iBronTask: item.iBronTask ?? 0,
            defectQuant: 0,
            barcodes: barcodesArray,
            isDefect: item.isDefect ?? false,
          }
        })
      } else {
        const data = await cardsService.getCards()
        availableCards.value = data.map(
          (item: CardItem): UnifiedProductItem => ({
            idName: item.idName ?? 0,
            cName: item.cName,
            cArt: item.cArt,
            irQuant: item.irQuant ?? 0,
            iBronTask: item.iBronTask ?? 0,
            defectQuant: item.defectQuant ?? 0,
            barcodes: item.barcodes || [],
            isDefect: false,
          }),
        )
      }
    },
    { toast: props.toast as ToastInstance, errorMessage: 'Не удалось загрузить данные товаров' },
  )
}

watch(
  () => props.isOpen,
  (newVal) => {
    if (!newVal) return
    Object.assign(formHeader, { phone: '', comment: '', eventDate: '', direction: '' })
    addedItems.value = []
    filterDefect.value = false
    loadAvailableItems()
  },
)

const quickAddProduct = (card: UnifiedProductItem) => {
  const limit = calculateAvailableToShip(card)
  if (props.modelType === 'ORD' && limit <= 0) {
    return props.toast?.show('Этого товара нет в наличии для отгрузки!', 'warning')
  }
  const barcode = card.barcodes?.[0] || 'Без ШК'
  const existing = addedItems.value.find(
    (i) =>
      i.idName === card.idName &&
      i.barcode === barcode &&
      (props.modelType !== 'ORD' || i.isDefect === card.isDefect),
  )
  if (existing) {
    if (props.modelType === 'ORD' && existing.qty >= limit) {
      return props.toast?.show(`Нельзя добавить больше доступного лимита (${limit} шт.)`, 'warning')
    }
    existing.qty += 1
  } else {
    addedItems.value.push({
      idName: card.idName,
      barcode,
      qty: 1,
      name: card.cName || 'Без названия',
      cArt: card.cArt || '—',
      isDefect: props.modelType === 'ORD' ? card.isDefect : false,
    })
  }
}

const validateInputQty = (item: LocalPosition) => {
  if (item.qty < 1 || !item.qty) item.qty = 1
  if (props.modelType === 'ORD') {
    const card = availableCards.value.find(
      (c) => c.idName === item.idName && c.isDefect === item.isDefect,
    )
    if (card) {
      const limit = calculateAvailableToShip(card)
      if (item.qty > limit) {
        props.toast?.show(`Превышен лимит! Доступно только ${limit} шт.`, 'warning')
        item.qty = limit
      }
    }
  }
}

const removePosition = (item: LocalPosition) => {
  const idx = addedItems.value.indexOf(item)
  if (idx !== -1) addedItems.value.splice(idx, 1)
}

const submitDocument = () => {
  if (addedItems.value.length === 0) return
  if (props.modelType === 'ORD') {
    for (const item of addedItems.value) {
      const card = availableCards.value.find(
        (c) => c.idName === item.idName && c.isDefect === item.isDefect,
      )
      if (card && item.qty > calculateAvailableToShip(card)) {
        return props.toast?.show(
          `Количество товара ${item.cArt} превышает доступный остаток!`,
          'error',
        )
      }
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
    { toast: props.toast as ToastInstance, successMessage: 'Документ успешно зарегистрирован!' },
  )
}

const close = () => emit('update:isOpen', false)
</script>

<style scoped>
.border-b {
  border-bottom: 1px solid var(--color-border);
}
.border-dark {
  border: 1px solid var(--color-border-dark);
}
.mt-4 {
  margin-top: var(--spacing-4);
}
.mb-6 {
  margin-bottom: 6px;
}
.px-6 {
  padding-left: var(--spacing-6);
  padding-right: var(--spacing-6);
}
.py-4 {
  padding-top: var(--spacing-4);
  padding-bottom: var(--spacing-4);
}
.py-12 {
  padding-top: var(--spacing-12);
  padding-bottom: var(--spacing-12);
}
.gap-16 {
  gap: var(--spacing-16);
}
.gap-32 {
  gap: var(--spacing-32);
}
.grid-2-cols {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.col-span-2 {
  grid-column: span 2 / span 2;
}

.table-add-btn {
  padding: 4px var(--spacing-12);
  font-size: 11px;
  height: auto;
  width: auto;
  font-weight: 700;
}
.added-items-table-wrapper {
  background: var(--color-surface);
  border-radius: var(--radius-8);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}
.empty-placeholder {
  text-align: center;
  padding: var(--spacing-40) var(--spacing-20);
  border-top: 1px solid var(--color-border-dark);
}

.custom-table-qty {
  width: 75px;
  padding: var(--spacing-4) var(--spacing-8) !important;
  font-size: 12px;
  font-weight: 700;
  text-align: center;
  border-radius: var(--radius-6);
  background-color: var(--color-background-secondary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-dark);
  outline: none;
}
.custom-table-qty:focus {
  border-color: var(--color-primary);
  background-color: var(--color-surface);
}
.table-row-delete-btn {
  width: 28px;
  height: 28px;
  background: transparent;
  border: none;
  color: var(--color-text-tertiary);
  font-weight: 700;
  cursor: pointer;
  transition: color var(--transition-fast);
}
.table-row-delete-btn:hover {
  color: var(--color-error-text);
}

@media (max-width: 640px) {
  .grid-2-cols {
    grid-template-columns: 1fr;
  }
  .col-span-2 {
    grid-column: span 1 / span 1;
  }
}
</style>
