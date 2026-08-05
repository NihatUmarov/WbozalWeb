<template>
  <ExcelImportLayout
    title="Импорт статусов активности"
    :status-text="`Распознано: ${parsedItems.length} товаров`"
    :has-data="parsedItems.length > 0"
    :errors="errors"
    template-title="Шаблон файла Excel"
    template-description="Загрузите файл Excel, содержащий штрихкоды и нужный статус (1 - в продаже, 0 - стоп):"
    :template-columns="['A (Штрихкод)', 'B (Статус: 1 или 0)']"
    grid-columns="32px 1fr 140px"
    @file-selected="onFileSelected"
    @reset="reset"
  >
    <template #mock-rows>
      <div class="mock-row">
        <div class="mock-cell cell-idx">1</div>
        <div class="mock-cell font-mono text-muted text-xs">2029618979629</div>
        <div class="mock-cell text-center font-bold text-xs text-success">1 (В продаже)</div>
      </div>
      <div class="mock-row">
        <div class="mock-cell cell-idx">2</div>
        <div class="mock-cell font-mono text-muted text-xs">2049048139363</div>
        <div class="mock-cell text-center font-bold text-xs text-error">0 (Заблокирован)</div>
      </div>
    </template>

    <div class="w-full flex flex-col gap-12">
      <div class="flex items-center justify-between">
        <span class="text-xs text-muted">
          В продаже (1): <strong class="text-success">{{ itemsToEnableCount }}</strong> |
          В стопе (0): <strong class="text-error">{{ itemsToDisableCount }}</strong>
        </span>
      </div>

      <SharedProductTable :items="parsedItems" :loading="false" max-height="380px" :hide-columns="['irQuant', 'iBronTask', 'defectQuant', 'size', 'barcodes']" :extra-columns="extraColumns">
        <template #cell(newStatus)="{ item }">
          <div class="flex justify-center">
            <AppBadge :variant="item.newIsActive ? 'success' : 'error'" :text="item.newIsActive ? 'В продажу (1)' : 'В Стоп-лист (0)'" />
          </div>
        </template>
      </SharedProductTable>
    </div>

    <div class="flex justify-end gap-12 mt-16 pt-12 border-t w-full">
      <button class="btn btn-secondary" @click="handleClose">Отмена</button>
      <button class="btn btn-primary" :disabled="!parsedItems.length || isSaving" @click="saveBulkStopList">
        <span v-if="isSaving" class="btn-spinner" />
        <span v-else>Применить изменения</span>
      </button>
    </div>
  </ExcelImportLayout>
</template>

<script setup lang="ts" generic="T extends MarketplaceProduct">
import { ref, computed } from 'vue'
import { productService, type MarketplaceProduct } from '@/api/productService'
import { useToast } from '@/composables/useToast'
import { useExcelReader } from '@/composables/useExcelReader'
import ExcelImportLayout from '@/components/ui/ExcelImportLayout.vue'
import SharedProductTable from '@/components/ui/ProductTable.vue'
import { AppBadge, type TableColumn } from '@/components/ui/BaseTable.vue'

interface ParsedStopListItem {
  marketplaceName: string
  barcodes: string[]
  newIsActive: boolean
  cName: string
  cArt: string
  primaryImageURL: string | null
}

const props = defineProps<{ catalogStopList: T[]; marketplace: 'ozon' | 'wb' }>()
const emit = defineEmits<{ (e: 'close'): void; (e: 'updated'): void }>()

const toast = useToast(), { readExcel } = useExcelReader(), isSaving = ref(false), parsedItems = ref<ParsedStopListItem[]>([]), errors = ref<string[]>([])
const extraColumns: TableColumn<ParsedStopListItem>[] = [{ key: 'newStatus', label: 'Новый статус', minWidth: '140px' }]

const itemsToEnableCount = computed(() => parsedItems.value.filter(i => i.newIsActive).length)
const itemsToDisableCount = computed(() => parsedItems.value.filter(i => !i.newIsActive).length)

const reset = () => { parsedItems.value = []; errors.value = [] }
const handleClose = () => { reset(); emit('close') }

const onFileSelected = async (file: File) => {
  const rows = await readExcel(file)
  if (!rows) return

  const itemsMap = new Map<string, ParsedStopListItem>()
  const startIdx = String(rows[0]?.[0] || '').toLowerCase().includes('шк') ? 1 : 0

  for (let i = startIdx; i < rows.length; i++) {
    const row = rows[i]
    if (!row || !row[0]) continue
    const barcode = String(row[0]).trim().toUpperCase()
    const product = props.catalogStopList.find(p => p.barcodes?.some(b => b.toUpperCase() === barcode))

    if (!product) { errors.value.push(`Штрихкод "${barcode}" не найден в текущем списке.`); continue }

    const status = String(row[1]).trim().toLowerCase()
    const newIsActive = ['1', 'да', 'вкл', 'true', 'active'].includes(status)

    itemsMap.set(barcode, {
      marketplaceName: product.marketplaceName,
      barcodes: [barcode],
      newIsActive,
      cName: product.marketplaceName,
      cArt: product.linkedArt || '—',
      primaryImageURL: product.linkedImage
    })
  }
  parsedItems.value = Array.from(itemsMap.values())
}

const saveBulkStopList = async () => {
  isSaving.value = true
  try {
    const toEnable = parsedItems.value.filter(i => i.newIsActive).map(i => i.barcodes[0])
    const toDisable = parsedItems.value.filter(i => !i.newIsActive).map(i => i.barcodes[0])

    if (toEnable.length) await productService.bulkUpdateActive({ marketplace: props.marketplace, barcodes: toEnable, isActive: true })
    if (toDisable.length) await productService.bulkUpdateActive({ marketplace: props.marketplace, barcodes: toDisable, isActive: false })

    toast.success('Статусы обновлены!'); emit('updated'); handleClose()
  } catch { toast.error('Ошибка сохранения') } finally { isSaving.value = false }
}
</script>
