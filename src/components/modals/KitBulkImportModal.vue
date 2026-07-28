<template>
  <div class="flex flex-col gap-24 py-12">
    <!-- Верхняя панель -->
    <section class="flex items-center justify-between gap-12 flex-wrap pb-8 border-b">
      <div class="flex items-center gap-16">
        <h3 class="text-lg font-bold text-primary m-0">Состав комплектов</h3>
        <span
          v-if="parsedKits.length"
          class="text-xs font-bold text-success bg-success-subtle border-success px-6 py-4 rounded-6 tabular-nums"
        >
          Распознано: {{ parsedKits.length }} компл.
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

    <!-- Инструкция (Показывается сразу) -->
    <div
      v-if="!parsedKits.length && !errors.length"
      class="flex flex-col items-center justify-center p-32 border-dark rounded-12 bg-secondary py-32 gap-20"
      style="border-style: dashed"
    >
      <div class="flex flex-col items-center text-center gap-4">
        <p class="text-primary font-semibold text-base m-0">Шаблон импорта комплектов</p>
        <p class="text-muted text-xs m-0">
          Убедитесь, что ваш Excel файл соответствует структуре ниже:
        </p>
      </div>

      <div class="mock-excel-table rounded-6 overflow-hidden w-full max-w-[480px]">
        <div class="mock-row mock-header">
          <div class="mock-cell cell-idx"></div>
          <div class="mock-cell">A (ШК 1)</div>
          <div class="mock-cell">B (ШК 2)</div>
          <div class="mock-cell">C (Кол-во)</div>
        </div>
        <div class="mock-row">
          <div class="mock-cell cell-idx">1</div>
          <div class="mock-cell font-mono text-muted text-xs">ШК_Комплекта_1</div>
          <div class="mock-cell font-mono text-muted text-xs">ШК_Товара_А</div>
          <div class="mock-cell text-center font-bold text-xs">2</div>
        </div>
      </div>

      <button class="btn btn-primary flex items-center gap-8 mt-4" @click="triggerExcelInput">
        <span>Выбрать и загрузить Excel</span>
      </button>
    </div>

    <!-- Ошибки -->
    <div
      v-if="errors.length"
      class="import-errors-container bg-error-subtle p-16 rounded-8 border-error"
    >
      <div class="flex justify-between items-center mb-12">
        <h4 class="text-error m-0 text-sm font-bold">Выявлены ошибки в кодах номенклатур:</h4>
        <button
          class="btn btn-secondary btn-xs border-error text-error bg-transparent"
          @click="reset"
        >
          Попробовать снова
        </button>
      </div>
      <ul class="m-0 text-xs text-error pl-16 flex flex-col gap-4">
        <li v-for="(err, i) in errors" :key="i" class="font-medium">{{ err }}</li>
      </ul>
    </div>

    <!-- Таблица превью данных -->
    <div v-if="parsedKits.length" class="w-full">
      <!-- УЛЬТИМАТИВНЫЙ ФИКС: Приводим к never[], обходя любые проверки CatalogItem[] -->
      <SharedProductTable
        :items="parsedKits as never[]"
        :loading="false"
        max-height="450px"
        :hide-columns="['irQuant', 'iBronTask', 'defectQuant', 'size', 'barcodes']"
        :extra-columns="tableStructureColumns"
      >
        <template #cell(kitParent)="{ item }">
          <div class="flex flex-col gap-2 py-4">
            <span class="font-bold text-primary text-sm truncate max-w-[300px]">{{
              (item as unknown as ParsedKitPreview).parentName
            }}</span>
            <span class="font-mono text-xs text-muted tracking-wider">{{
              (item as unknown as ParsedKitPreview).parentBarcode
            }}</span>
          </div>
        </template>

        <template #cell(kitComponents)="{ item }">
          <div class="flex flex-col gap-6 py-4">
            <div
              v-for="(comp, cIdx) in (item as unknown as ParsedKitPreview).components"
              :key="cIdx"
              class="flex items-center justify-between gap-12 bg-secondary px-12 py-6 rounded-6 border-dark"
            >
              <div class="flex flex-col">
                <span class="text-xs font-semibold text-primary truncate max-w-[280px]">{{
                  comp.childName
                }}</span>
                <span class="font-mono text-[11px] text-muted">{{ comp.childBarcode }}</span>
              </div>
              <span class="badge badge--info tabular-nums font-bold">{{ comp.qty }} шт.</span>
            </div>
          </div>
        </template>
      </SharedProductTable>
    </div>

    <!-- Кнопки действия -->
    <div class="flex justify-end gap-12 mt-16 pt-12 border-t w-full">
      <button class="btn btn-secondary" @click="handleClose">Отмена</button>
      <button
        class="btn btn-primary"
        :disabled="!parsedKits.length || isSaving"
        @click="saveBulkKits"
      >
        <span v-if="isSaving" class="btn-spinner"></span>
        <span v-else>Сохранить изменения</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import * as XLSX from 'xlsx'
import { cardsService } from '@/api/cardsService'
import { useToast } from '@/composables/useToast'
import SharedProductTable from '@/components/ui/CatalogTable.vue'
import type { TableColumn } from '@/components/ui/BaseTable.vue'
import type { CardItem, SaveKitRequest } from '@/api/cardsService'

interface ParsedKitPreview {
  parentIdName: number
  parentBarcode: string
  parentName: string
  components: {
    childIdName: number
    childBarcode: string
    childName: string
    qty: number
  }[]
}

const props = defineProps<{ catalogCards: CardItem[] }>()
const emit = defineEmits<{ (e: 'close'): void; (e: 'updated'): void }>()

const toast = useToast()
const excelInputRef = ref<HTMLInputElement | null>(null)
const isSaving = ref(false)
const parsedKits = ref<ParsedKitPreview[]>([])
const errors = ref<string[]>([])

const tableStructureColumns = computed(() => {
  return [
    { key: 'kitParent', label: 'Комплект (ШК1)', width: '45%' },
    { key: 'kitComponents', label: 'Состав комплекта (ШК2 : Кол-во)', width: '55%' },
  ] as unknown as TableColumn<unknown>[]
})

const triggerExcelInput = () => {
  reset()
  excelInputRef.value?.click()
}
const reset = () => {
  parsedKits.value = []
  errors.value = []
  if (excelInputRef.value) excelInputRef.value.value = ''
}
const handleClose = () => {
  reset()
  emit('close')
}

const findCardByBarcode = (barcode: string) => {
  const cleanBarcode = String(barcode).trim()
  return props.catalogCards.find((c) =>
    c.barcodes?.map((b) => String(b).trim()).includes(cleanBarcode),
  )
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
      const kitMap = new Map<string, ParsedKitPreview>()
      const startIndex = String(rawRows[0]?.[0] || '')
        .toLowerCase()
        .includes('шк')
        ? 1
        : 0

      for (let i = startIndex; i < rawRows.length; i++) {
        const row = rawRows[i]
        if (!row || (!row[0] && !row[1])) continue

        const parentBarcode = String(row[0] || '').trim()
        const childBarcode = String(row[1] || '').trim()
        const qty = parseInt(String(row[2] || '1').trim(), 10)

        if (!parentBarcode || !childBarcode) continue

        const parentCard = findCardByBarcode(parentBarcode)
        const childCard = findCardByBarcode(childBarcode)

        if (!parentCard) {
          errors.value.push(`Комплект (ШК1): ${parentBarcode} не найден.`)
          continue
        }
        if (!childCard) {
          errors.value.push(`Компонент (ШК2): ${childBarcode} не найден.`)
          continue
        }
        if (isNaN(qty) || qty <= 0) {
          errors.value.push(`Неверное количество в связке ШК ${parentBarcode}.`)
          continue
        }

        if (!kitMap.has(parentBarcode)) {
          kitMap.set(parentBarcode, {
            parentIdName: parentCard.idName,
            parentBarcode,
            parentName: parentCard.cName || 'Без названия',
            components: [],
          })
        }
        kitMap.get(parentBarcode)!.components.push({
          childIdName: childCard.idName,
          childBarcode,
          childName: childCard.cName || 'Без названия',
          qty,
        })
      }

      parsedKits.value = Array.from(kitMap.values())
      if (!parsedKits.value.length) toast.error('Данные не найдены.')
      else if (errors.value.length) toast.warning('Загружено с ошибками.')
      else toast.success('Файл верифицирован!')
    } catch {
      toast.error('Ошибка чтения Excel')
    } finally {
      target.value = ''
    }
  }
  reader.readAsArrayBuffer(target.files[0])
}

const saveBulkKits = async () => {
  if (!parsedKits.value.length) return
  isSaving.value = true
  const payload: SaveKitRequest[] = parsedKits.value.map((kit) => ({
    idParentName: kit.parentIdName,
    components: kit.components.map((c) => ({ idChildName: c.childIdName, qty: c.qty })),
  }))

  try {
    const res = await cardsService.bulkSaveKits({ kits: payload })
    if (res.success) {
      toast.success(res.message)
      emit('updated')
      handleClose()
    }
  } catch {
    toast.error('Ошибка сохранения')
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
  grid-template-columns: 32px 1fr 1fr 80px;
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
