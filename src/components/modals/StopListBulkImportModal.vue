<template>
  <ExcelImportLayout
    title="Импорт статусов активности (Стоп-лист)"
    :status-text="`Распознано: ${parsedItems.length} товаров`"
    :has-data="parsedItems.length > 0"
    :errors="errors"
    template-title="Шаблон файла Excel"
    template-description="Загрузите файл Excel, содержащий штрихкоды/артикулы и нужный статус:"
    :template-columns="['A (ШК / Артикул)', 'B (Статус: 1 или 0)']"
    grid-columns="32px 1fr 140px"
    @file-selected="onFileSelected"
    @reset="reset"
  >
    <template #mock-rows>
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
    </template>

    <div class="w-full flex flex-col gap-12">
      <div class="flex items-center justify-between">
        <span class="text-xs text-muted">
          В продаже (1): <strong class="text-success">{{ itemsToEnableCount }}</strong> |
          В стопе (0): <strong class="text-error">{{ itemsToDisableCount }}</strong>
        </span>
      </div>

      <SharedProductTable
        :items="parsedItems as never[]"
        :loading="false"
        max-height="380px"
        :hide-columns="['irQuant', 'iBronTask', 'defectQuant']"
        :extra-columns="extraColumns"
      >
        <template #cell(newStatus)="{ item }: { item: ParsedStopListItem }">
          <div class="flex justify-center">
            <AppBadge
              :variant="item.newIsActive ? 'success' : 'error'"
              :text="item.newIsActive ? 'В продажу (1)' : 'В Стоп-лист (0)'"
            />
          </div>
        </template>
      </SharedProductTable>
    </div>

    <div class="flex justify-end gap-12 mt-16 pt-12 border-t w-full">
      <button class="btn btn-secondary" @click="handleClose">Отмена</button>
      <button class="btn btn-primary" :disabled="!parsedItems.length || isSaving" @click="saveBulkStopList">
        <span v-if="isSaving" class="btn-spinner"></span>
        <span v-else>Применить изменения</span>
      </button>
    </div>
  </ExcelImportLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { productService, type StopListItem } from '@/api/productService'
import { useToast } from '@/composables/useToast'
import { useExcelReader } from '@/composables/useExcelReader'
import ExcelImportLayout from '@/components/ui/ExcelImportLayout.vue'
import SharedProductTable from '@/components/ui/CatalogTable.vue'
import { AppBadge, type TableColumn } from '@/components/ui/BaseTable.vue'

interface ParsedStopListItem extends StopListItem {
  newIsActive: boolean
}

const props = defineProps<{ catalogStopList: StopListItem[] }>()
const emit = defineEmits<{ (e: 'close'): void; (e: 'updated'): void }>()

const toast = useToast()
const { readExcel } = useExcelReader()
const isSaving = ref(false)
const parsedItems = ref<ParsedStopListItem[]>([])
const errors = ref<string[]>([])

const extraColumns: TableColumn<ParsedStopListItem>[] = [
  { key: 'newStatus', label: 'Новый статус', minWidth: '140px' },
]

const itemsToEnableCount = computed(() => parsedItems.value.filter(i => i.newIsActive).length)
const itemsToDisableCount = computed(() => parsedItems.value.filter(i => !i.newIsActive).length)

const reset = () => {
  parsedItems.value = []
  errors.value = []
}
const handleClose = () => {
  reset()
  emit('close')
}

const onFileSelected = async (file: File) => {
  const rows = await readExcel(file)
  if (!rows) return

  const itemsMap = new Map<number, ParsedStopListItem>()
  const startIdx = String(rows[0]?.[0] || '').toLowerCase().search(/шк|код|артикул|id/) !== -1 ? 1 : 0

  for (let i = startIdx; i < rows.length; i++) {
    const row = rows[i]
    if (!row || !row[0]) continue
    const code = String(row[0]).trim().toLowerCase()
    const card = props.catalogStopList.find(c =>
      c.cArt?.toLowerCase() === code ||
      String(c.idName) === code ||
      c.barcodes?.some(b => b.toLowerCase() === code)
    )
    if (!card) {
      errors.value.push(`Товар "${code}" не найден.`)
      continue
    }
    const status = String(row[1]).trim().toLowerCase()
    const newIsActive = ['1', 'да', 'вкл', 'true', 'active'].includes(status)
    itemsMap.set(card.idName, { ...card, newIsActive })
  }
  parsedItems.value = Array.from(itemsMap.values())
}

const saveBulkStopList = async () => {
  isSaving.value = true
  try {
    const toEnable = parsedItems.value.filter(i => i.newIsActive).map(i => i.idName)
    const toDisable = parsedItems.value.filter(i => !i.newIsActive).map(i => i.idName)
    if (toEnable.length) await productService.updateStopList({ idNames: toEnable, isActive: true })
    if (toDisable.length) await productService.updateStopList({ idNames: toDisable, isActive: false })
    toast.success('Статусы обновлены!')
    emit('updated')
    handleClose()
  } catch {
    toast.error('Ошибка сохранения')
  } finally {
    isSaving.value = false
  }
}
</script>
