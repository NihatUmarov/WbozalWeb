<template>
  <div class="flex flex-col gap-24 py-12">
    <!-- Верхняя панель -->
    <section class="flex items-center justify-between gap-12 flex-wrap pb-8 border-b">
      <div class="flex items-center gap-16">
        <h3 class="text-lg font-bold text-primary m-0">Импорт статусов активности (Стоп-лист)</h3>
        <span
          v-if="parsedItems.length"
          class="text-xs font-bold text-success bg-success-subtle border-success px-6 py-4 rounded-6 tabular-nums"
        >
          Распознано: {{ parsedItems.length }} товаров
        </span>
      </div>
      <input
        type="file"
        ref="excelInputRef"
        accept=".xlsx, .xls"
        class="hidden"
        @change="handleFileUpload"
      />
    </section>

    <!-- Инструкция с макетом Excel таблицы (Показывается сразу) -->
    <div
      v-if="!parsedItems.length && !errors.length"
      class="flex flex-col items-center justify-center p-32 border-dark rounded-12 bg-secondary py-32 gap-20"
      style="border-style: dashed"
    >
      <div class="flex flex-col items-center text-center gap-4">
        <p class="text-primary font-semibold text-base m-0">Шаблон файла Excel</p>
        <p class="text-muted text-xs m-0">
          Загрузите файл Excel, содержащий штрихкоды/артикулы и нужный статус:
        </p>
      </div>

      <!-- Визуальный макет Excel -->
      <div class="mock-excel-table rounded-6 overflow-hidden w-full max-w-[420px]">
        <div class="mock-row mock-header">
          <div class="mock-cell cell-idx"></div>
          <div class="mock-cell">A (ШК / Артикул)</div>
          <div class="mock-cell">B (Статус: 1 или 0)</div>
        </div>
        <div class="mock-row">
          <div class="mock-cell cell-idx">1</div>
          <div class="mock-cell font-mono text-muted text-xs">4601234567890</div>
          <div class="mock-cell text-center font-bold text-xs text-success">1 (В продаже)</div>
        </div>
        <div class="mock-row">
          <div class="mock-cell cell-idx">2</div>
          <div class="mock-cell font-mono text-muted text-xs">ART-9921-X</div>
          <div class="mock-cell text-center font-bold text-xs text-error">0 (Заблокирован)</div>
        </div>
      </div>

      <button class="btn btn-primary flex items-center gap-8 mt-4" @click="triggerExcelInput">
        <span>Выбрать и загрузить Excel</span>
      </button>
    </div>

    <!-- Ошибки валидации -->
    <div
      v-if="errors.length"
      class="import-errors-container bg-error-subtle p-16 rounded-8 border-error"
    >
      <div class="flex justify-between items-center mb-12">
        <h4 class="text-error m-0 text-sm font-bold">Выявлены ошибки в файле Excel:</h4>
        <button
          class="btn btn-secondary btn-xs border-error text-error bg-transparent"
          @click="reset"
        >
          Попробовать снова
        </button>
      </div>
      <ul class="m-0 text-xs text-error pl-16 flex flex-col gap-4 max-h-[160px] overflow-y-auto">
        <li v-for="(err, i) in errors" :key="i" class="font-medium">{{ err }}</li>
      </ul>
    </div>

    <!-- Превью распознанных товаров в SharedProductTable -->
    <div v-if="parsedItems.length" class="w-full flex flex-col gap-12">
      <div class="flex items-center justify-between">
        <span class="text-xs text-muted">
          К включению (1): <strong class="text-success">{{ itemsToEnableCount }}</strong> | К
          блокировке (0):
          <strong class="text-error">{{ itemsToDisableCount }}</strong>
        </span>
        <button class="btn btn-xs btn-secondary" @click="reset">Загрузить другой файл</button>
      </div>

      <div class="card no-padding overflow-hidden border border-dark">
        <SharedProductTable
          :items="parsedItems as never[]"
          :loading="false"
          max-height="380px"
          :hide-columns="['irQuant', 'iBronTask', 'defectQuant']"
          :extra-columns="extraColumns"
        >
          <template #cell(newStatus)="{ item }: { item: ParsedStopListItem }">
            <div class="flex justify-center">
              <span
                :class="[
                  'badge py-4 px-10 text-xs font-bold border',
                  item.newIsActive
                    ? 'badge--success border-success/30'
                    : 'badge--error border-error/30',
                ]"
              >
                {{ item.newIsActive ? 'В продажу (1)' : 'В Стоп-лист (0)' }}
              </span>
            </div>
          </template>
        </SharedProductTable>
      </div>
    </div>

    <!-- Футер / Кнопки действия -->
    <div class="flex justify-end gap-12 mt-16 pt-12 border-t w-full">
      <button class="btn btn-secondary" @click="handleClose">Отмена</button>
      <button
        class="btn btn-primary"
        :disabled="!parsedItems.length || isSaving"
        @click="saveBulkStopList"
      >
        <span v-if="isSaving" class="btn-spinner"></span>
        <span v-else>Применить изменения</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import * as XLSX from 'xlsx'
import { cardsService, type StopListItem } from '@/api/cardsService'
import { useToast } from '@/composables/useToast'
import SharedProductTable from '@/components/ui/CatalogTable.vue'
import type { TableColumn } from '@/components/ui/BaseTable.vue'

interface ParsedStopListItem extends StopListItem {
  newIsActive: boolean
}

const props = defineProps<{ catalogStopList: StopListItem[] }>()
const emit = defineEmits<{ (e: 'close'): void; (e: 'updated'): void }>()

const toast = useToast()
const excelInputRef = ref<HTMLInputElement | null>(null)
const isSaving = ref(false)
const parsedItems = ref<ParsedStopListItem[]>([])
const errors = ref<string[]>([])

const extraColumns: TableColumn<unknown>[] = [
  { key: 'newStatus', label: 'Новый статус', minWidth: '140px' },
]

const itemsToEnableCount = computed(() => parsedItems.value.filter((i) => i.newIsActive).length)
const itemsToDisableCount = computed(() => parsedItems.value.filter((i) => !i.newIsActive).length)

const triggerExcelInput = () => {
  reset()
  excelInputRef.value?.click()
}

const reset = () => {
  parsedItems.value = []
  errors.value = []
  if (excelInputRef.value) excelInputRef.value.value = ''
}

const handleClose = () => {
  reset()
  emit('close')
}

// Умный поиск номенклатуры по ШК, Артикулу или ID
const findCardByCode = (code: string) => {
  const cleanCode = String(code).trim().toLowerCase()
  return props.catalogStopList.find((c) => {
    const art = (c.cArt || '').trim().toLowerCase()
    const id = String(c.idName)
    const hasBarcode = c.barcodes?.some((b) => String(b).trim().toLowerCase() === cleanCode)
    return art === cleanCode || id === cleanCode || hasBarcode
  })
}

// Парсинг статуса (1, 0, Да, Нет, Вкл, Выкл, true, false)
const parseStatusValue = (val: unknown): boolean | null => {
  if (val === undefined || val === null) return null
  const str = String(val).trim().toLowerCase()

  if (['1', 'да', 'вкл', 'true', 'active', 'продажа'].includes(str)) return true
  if (['0', 'нет', 'выкл', 'false', 'stop', 'блок'].includes(str)) return false

  return null
}

const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (!target.files?.length) return
  const reader = new FileReader()

  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target?.result as ArrayBuffer)
      const workbook = XLSX.read(data, { type: 'array' })
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const rawRows = XLSX.utils.sheet_to_json<(string | number)[]>(worksheet, { header: 1 })

      errors.value = []
      const itemsMap = new Map<number, ParsedStopListItem>()

      // Пропускаем заголовки, если они есть
      const startIndex =
        String(rawRows[0]?.[0] || '')
          .toLowerCase()
          .search(/шк|код|артикул|id/) !== -1
          ? 1
          : 0

      for (let i = startIndex; i < rawRows.length; i++) {
        const row = rawRows[i]
        if (!row || !row[0]) continue

        const code = String(row[0] || '').trim()
        const rawStatus = row[1]

        if (!code) continue

        const card = findCardByCode(code)
        if (!card) {
          errors.value.push(`Строка ${i + 1}: Товар с ШК/Артикулом "${code}" не найден в базе.`)
          continue
        }

        const newIsActive = parseStatusValue(rawStatus)
        if (newIsActive === null) {
          errors.value.push(
            `Строка ${i + 1}: Нераспознанный статус "${rawStatus}" для товара ${code}. Укажите 1 или 0.`,
          )
          continue
        }

        itemsMap.set(card.idName, {
          ...card,
          newIsActive,
        })
      }

      parsedItems.value = Array.from(itemsMap.values())

      if (!parsedItems.value.length && !errors.value.length) {
        toast.error('В файле не найдено корректных строк.')
      } else if (errors.value.length) {
        toast.warning('Файл прочитан с ошибками.')
      } else {
        toast.success(`Распознано ${parsedItems.value.length} товаров!`)
      }
    } catch {
      toast.error('Ошибка при чтении Excel файла')
    } finally {
      target.value = ''
    }
  }
  reader.readAsArrayBuffer(target.files[0])
}

const saveBulkStopList = async () => {
  if (!parsedItems.value.length) return
  isSaving.value = true

  // Разделяем на 2 группы: включаемые и выключаемые
  const toEnable = parsedItems.value.filter((i) => i.newIsActive).map((i) => i.idName)
  const toDisable = parsedItems.value.filter((i) => !i.newIsActive).map((i) => i.idName)

  try {
    if (toEnable.length) {
      await cardsService.updateStopList({ idNames: toEnable, isActive: true })
    }
    if (toDisable.length) {
      await cardsService.updateStopList({ idNames: toDisable, isActive: false })
    }

    toast.success('Статусы товаров успешно обновлены!')
    emit('updated')
    handleClose()
  } catch {
    toast.error('Не удалось сохранить изменения')
  } finally {
    isSaving.value = false
  }
}
</script>

<style scoped>
.mock-excel-table {
  display: flex;
  flex-direction: column;
  width: 100%;
  border: 1px solid var(--color-border-dark);
  font-size: 11px;
  background: var(--color-surface);
  color: var(--color-text-primary);
}
.mock-row {
  display: grid;
  grid-template-columns: 32px 1fr 140px;
  border-bottom: 1px solid var(--color-border-dark);
}
.mock-row:last-child {
  border-bottom: none;
}
.mock-cell {
  padding: var(--spacing-4) var(--spacing-8);
  border-right: 1px solid var(--color-border-dark);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mock-cell:last-child {
  border-right: none;
}
.mock-cell.cell-idx {
  background-color: var(--color-background-secondary);
  text-align: center;
  font-weight: 600;
  color: var(--color-text-secondary);
}
.mock-header {
  background-color: var(--color-background-secondary);
  text-align: center;
  font-weight: 600;
  color: var(--color-text-secondary);
}
</style>
