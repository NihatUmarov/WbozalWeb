<template>
  <ExcelImportLayout
    title="Состав комплектов"
    :status-text="`Распознано: ${parsedKits.length} компл.`"
    :has-data="parsedKits.length > 0"
    :errors="errors"
    template-title="Шаблон импорта комплектов"
    template-description="Убедитесь, что ваш Excel файл соответствует структуре ниже:"
    :template-columns="['A (ШК 1)', 'B (ШК 2)', 'C (Кол-во)']"
    grid-columns="32px 1fr 1fr 80px"
    @file-selected="onFileSelected"
    @reset="reset"
  >
    <template #mock-rows>
      <div class="mock-row">
        <div class="mock-cell cell-idx">1</div>
        <div class="mock-cell font-mono text-muted text-xs">ШК_Комплекта_1</div>
        <div class="mock-cell font-mono text-muted text-xs">ШК_Товара_А</div>
        <div class="mock-cell text-center font-bold text-xs">2</div>
      </div>
    </template>

    <div class="w-full">
      <SharedProductTable
        :items="parsedKits as never[]"
        :loading="false"
        max-height="450px"
        :hide-columns="['irQuant', 'iBronTask', 'defectQuant', 'size', 'barcodes']"
        :extra-columns="tableStructureColumns"
      >
        <template #cell(kitParent)="{ item }">
          <div class="flex flex-col gap-2 py-4">
            <AppTableCell :value="(item as ParsedKitPreview).parentName" bold />
            <AppTableCell :value="(item as ParsedKitPreview).parentBarcode" mono size="xs" color="muted" />
          </div>
        </template>
        <template #cell(kitComponents)="{ item }">
          <div class="flex flex-col gap-6 py-4">
            <div
              v-for="(comp, cIdx) in (item as ParsedKitPreview).components"
              :key="cIdx"
              class="flex items-center justify-between gap-12 bg-secondary px-12 py-6 rounded-6 border-dark"
            >
              <div class="flex flex-col">
                <AppTableCell :value="comp.childName" bold size="xs" />
                <AppTableCell :value="comp.childBarcode" mono size="xs" color="muted" />
              </div>
              <AppBadge variant="info" :text="`${comp.qty} шт.`" />
            </div>
          </div>
        </template>
      </SharedProductTable>
    </div>

    <div class="flex justify-end gap-12 mt-16 pt-12 border-t w-full">
      <button class="btn btn-secondary" @click="handleClose">Отмена</button>
      <button class="btn btn-primary" :disabled="!parsedKits.length || isSaving" @click="saveBulkKits">
        <span v-if="isSaving" class="btn-spinner"></span>
        <span v-else>Сохранить изменения</span>
      </button>
    </div>
  </ExcelImportLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { productService, type SaveKitRequest } from '@/api/productService'
import type { Product } from '@/api/types'
import { useToast } from '@/composables/useToast'
import { useExcelReader } from '@/composables/useExcelReader'
import ExcelImportLayout from '@/components/ui/ExcelImportLayout.vue'
import SharedProductTable from '@/components/ui/ProductTable.vue'
import { AppBadge, AppTableCell, type TableColumn } from '@/components/ui/BaseTable.vue'

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

const props = defineProps<{ catalogCards: Product[] }>()
const emit = defineEmits<{ (e: 'close'): void; (e: 'updated'): void }>()

const toast = useToast()
const { readExcel } = useExcelReader()
const isSaving = ref(false)
const parsedKits = ref<ParsedKitPreview[]>([])
const errors = ref<string[]>([])

const tableStructureColumns = computed<TableColumn<ParsedKitPreview>[]>(() => [
  { key: 'kitParent', label: 'Комплект (ШК1)', width: '45%' },
  { key: 'kitComponents', label: 'Состав комплекта (ШК2 : Кол-во)', width: '55%' },
])

const reset = () => {
  parsedKits.value = []
  errors.value = []
}

const handleClose = () => {
  reset()
  emit('close')
}

const onFileSelected = async (file: File) => {
  const rows = await readExcel(file)
  if (!rows) return

  const kitMap = new Map<string, ParsedKitPreview>()
  const startIdx = String(rows[0]?.[0] || '').toLowerCase().includes('шк') ? 1 : 0

  for (let i = startIdx; i < rows.length; i++) {
    const row = rows[i]
    if (!row || (!row[0] && !row[1])) continue

    const pBarcode = String(row[0] || '').trim()
    const cBarcode = String(row[1] || '').trim()
    const qty = parseInt(String(row[2] || '1').trim(), 10)

    const parentCard = props.catalogCards.find(c => c.barcodes?.includes(pBarcode))
    const childCard = props.catalogCards.find(c => c.barcodes?.includes(cBarcode))

    if (!parentCard) errors.value.push(`Комплект: ${pBarcode} не найден.`)
    else if (!childCard) errors.value.push(`Компонент: ${cBarcode} не найден.`)
    else if (isNaN(qty) || qty <= 0) errors.value.push(`Неверное кол-во для ШК ${pBarcode}.`)
    else {
      if (!kitMap.has(pBarcode)) {
        kitMap.set(pBarcode, {
          parentIdName: parentCard.idName,
          parentBarcode: pBarcode,
          parentName: parentCard.cName || 'Без названия',
          components: [],
        })
      }
      kitMap.get(pBarcode)!.components.push({
        childIdName: childCard.idName,
        childBarcode: cBarcode,
        childName: childCard.cName || 'Без названия',
        qty,
      })
    }
  }
  parsedKits.value = Array.from(kitMap.values())
  if (!parsedKits.value.length) toast.error('Данные не найдены.')
}

const saveBulkKits = async () => {
  isSaving.value = true
  const payload: SaveKitRequest[] = parsedKits.value.map(k => ({
    idParentName: k.parentIdName,
    components: k.components.map(c => ({ idChildName: c.childIdName, qty: c.qty })),
  }))
  try {
    const res = await productService.bulkSaveKits({ kits: payload })
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
