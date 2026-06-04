<template>
  <BaseBottomSheet :is-open="isOpen" max-width="7xl" @update:is-open="close">
    <template #header>
      <div class="flex items-center gap-3">
        <StatusBadge variant="success">Создание</StatusBadge>
        <h3 class="m-0 text-xl font-bold text-primary">
          Новый документ: {{ modelType === 'FBO' ? 'Приход (FBO)' : 'Отгрузка (ORD)' }}
        </h3>
      </div>
    </template>

    <div class="flex flex-col gap-5">
      <div class="bg-surface p-5 rounded border border-border flex flex-col gap-4">
        <div class="flex items-center gap-2 pb-1 border-b border-border/60">
          <FileText class="w-4 h-4 text-secondary" />
          <h4 class="text-sm font-bold text-primary m-0">Основная информация</h4>
        </div>

        <div class="grid grid-cols-2 gap-5 sm:grid-cols-1">
          <BaseInput
            v-model="formHeader.phone"
            label="Телефон контактного лица"
            placeholder="+7 (999) 000-00-00"
          />
          <BaseInput
            v-model="formHeader.eventDate"
            type="date"
            :label="modelType === 'FBO' ? 'Планируемая дата прихода' : 'Планируемая дата отгрузки'"
          />
        </div>
        <div class="grid grid-cols-2 gap-5 sm:grid-cols-1">
          <BaseInput
            v-model="formHeader.direction"
            label="Направление (Куда / Откуда)"
            placeholder="Коледино, Озон, г. Москва..."
          />
          <BaseInput
            v-model="formHeader.comment"
            label="Комментарий к документу"
            placeholder="Дополнительная информация для склада..."
          />
        </div>
      </div>

      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between px-1 gap-4 flex-wrap">
          <div class="flex items-center gap-2">
            <Package class="w-4 h-4 text-secondary" />
            <h4 class="text-xs font-bold text-muted uppercase tracking-wider m-0">
              Каталог товаров (Используйте фильтры для быстрого поиска)
            </h4>
          </div>

          <ToggleSwitch
            v-if="modelType === 'ORD'"
            v-model="filterDefect"
            label="Показать только брак"
            variant="defect"
            @update:model-value="loadAvailableItems"
          />
        </div>

        <BaseTable
          :items="availableCards"
          :columns="catalogColumns"
          max-height="240px"
          :loading="loading"
        >
          <template #cell(cArt)="{ item }">
            <span
              class="font-mono text-xs bg-secondary text-primary font-semibold px-2 py-0.5 rounded border border-border"
            >
              {{ item.cArt || '—' }}
            </span>
          </template>

          <template #cell(cName)="{ item }">
            <div class="flex items-center py-0.5">
              <div class="flex flex-col min-w-0">
                <span
                  class="text-sm font-semibold text-primary truncate max-w-md"
                  :title="String(item.cName || '')"
                >
                  {{ item.cName || 'Без названия' }}
                </span>
                <span class="text-xs text-muted font-mono tracking-wider mt-0.5"
                  >ID: {{ item.idName }}</span
                >
              </div>
            </div>
          </template>

          <template #cell(barcodes)="{ item }">
            <span
              class="font-mono text-secondary text-xs tracking-wider bg-surface px-1.5 py-0.5 rounded border border-border/40"
            >
              {{ item.barcodes?.[0] || '—' }}
            </span>
          </template>

          <template #cell(stock)="{ item }">
            <span
              :class="
                calculateAvailableToShip(item) > 0
                  ? 'text-success font-bold bg-success-subtle border-success/10'
                  : 'text-error font-bold bg-error-subtle border-error/10'
              "
              class="inline-block px-2 py-0.5 rounded text-sm tabular-nums border"
            >
              {{ calculateAvailableToShip(item) }} шт.
            </span>
          </template>

          <template #cell(isDefect)="{ value }">
            <StatusBadge :variant="value ? 'error' : 'success'">
              {{ value ? 'Брак' : 'Исправен' }}
            </StatusBadge>
          </template>

          <template #cell(actions)="{ item }">
            <BaseButton
              :variant="
                modelType === 'ORD' && calculateAvailableToShip(item) <= 0 ? 'disabled' : 'primary'
              "
              :disabled="modelType === 'ORD' && calculateAvailableToShip(item) <= 0"
              class="py-1.5 px-3 text-xs h-auto w-auto font-bold"
              @click="quickAddProduct(item)"
            >
              Добавить
            </BaseButton>
          </template>
        </BaseTable>
      </div>

      <div class="flex flex-col gap-2">
        <div class="flex items-center gap-2 px-1">
          <CheckSquare class="w-4 h-4 text-secondary" />
          <h4 class="text-xs font-bold text-muted uppercase tracking-wider m-0">
            Позиций к добавлению в документ ({{ addedItems.length }})
          </h4>
        </div>

        <div class="bg-surface border border-border rounded shadow-sm overflow-hidden">
          <BaseTable :items="addedItems" :columns="addedItemsColumns">
            <template #cell(product)="{ item }">
              <div class="flex items-center py-0.5">
                <div class="flex flex-col min-w-0 gap-1 items-start">
                  <span
                    class="text-sm font-semibold text-primary truncate max-w-md"
                    :title="item.name"
                  >
                    {{ item.name }}
                  </span>
                  <div class="flex items-center gap-1.5">
                    <span
                      class="font-mono text-[10px] bg-secondary text-primary font-semibold px-1.5 py-0.5 rounded border border-border"
                    >
                      {{ item.cArt }}
                    </span>
                    <span
                      v-if="item.isDefect"
                      class="text-[10px] font-bold uppercase tracking-wider text-error bg-error-subtle px-1 rounded border border-error/20"
                    >
                      Брак
                    </span>
                  </div>
                </div>
              </div>
            </template>

            <template #cell(barcode)="{ value }">
              <span
                class="font-mono text-secondary text-xs tracking-wider bg-surface px-1.5 py-0.5 rounded border border-border/40"
              >
                {{ value }}
              </span>
            </template>

            <template #cell(qty)="{ item }">
              <div class="flex items-center gap-2">
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
                class="table-row-delete-btn flex items-center justify-center font-bold cursor-pointer transition-all text-sm rounded-md"
                title="Удалить позицию"
                @click="removePosition(item)"
              >
                ✕
              </button>
            </template>
          </BaseTable>

          <div
            v-if="addedItems.length === 0"
            class="text-center py-10 text-muted text-sm font-medium border-t border-border-light"
          >
            Вы пока не добавили ни одного товара из каталога выше
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <BaseButton :disabled="addedItems.length === 0" :loading="isSaving" @click="submitDocument">
        Сохранить и отправить на склад
      </BaseButton>
    </template>
  </BaseBottomSheet>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive } from 'vue'
import { FileText, Package, CheckSquare } from 'lucide-vue-next'
import { stockService } from '@/api/stockService'
import { cardsService } from '@/api/cardsService'
import { remainsService } from '@/api/remainsService'
import { useAsync } from '@/composables/useAsync'
import type { CardItem, RemainItem } from '@/api/types'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBottomSheet from '@/components/ui/BaseBottomSheet.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import ToggleSwitch from '@/components/ui/ToggleSwitch.vue'
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

// Описываем интерфейс элемента, который будет крутиться в таблице, на основе реального CardItem из проекта
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

// ИСПРАВЛЕНО: Синтаксис computed полностью починен, типы возвращаются корректно
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
          // Безопасно проверяем, существует ли массив barcodes в объекте
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
    {
      toast: props.toast as ToastInstance,
      errorMessage: 'Не удалось загрузить данные товаров',
    },
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
  if (idx !== -1) {
    addedItems.value.splice(idx, 1)
  }
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
        direction: formHeader.direction,
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
.custom-table-qty {
  width: 75px;
  padding: var(--spacing-6) var(--spacing-10);
  border: 1px solid var(--color-border-dark);
  background-color: var(--color-background-secondary);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  text-align: center;
  border-radius: var(--border-radius-6);
  outline: none;
  transition: all var(--transition-fast);
}

.custom-table-qty:focus {
  border-color: var(--color-primary);
  background-color: var(--color-surface);
  box-shadow: 0 0 0 2px var(--color-primary-subtle);
}

.table-row-delete-btn {
  width: 28px;
  height: 28px;
  background: transparent;
  border: 1px solid transparent;
  color: var(--color-text-tertiary);
  transition: all var(--transition-fast);
}

.table-row-delete-btn:hover {
  color: var(--color-error-text);
  background-color: var(--color-error-subtle);
  border-color: var(--color-error-text);
}
</style>
