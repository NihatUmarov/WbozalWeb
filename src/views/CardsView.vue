<template>
  <MainLayout>
    <div class="flex flex-col gap-16 p-16">
      <div class="card flex flex-wrap items-center justify-between gap-12 p-16">
        <h2 class="text-xl font-bold text-primary m-0">Карточки товаров (МультиШК)</h2>
        <div class="flex items-center gap-12">
          <button class="btn btn-secondary flex items-center gap-8" @click="exportToExcel">
            <img src="@/components/icons/office-exel.svg" alt="Excel" width="16" height="16" />
            <span>Выгрузить в Excel</span>
          </button>
        </div>
      </div>

      <div class="card no-padding overflow-hidden">
        <SharedProductTable
          ref="tableRef"
          :items="cards"
          :loading="loading"
          :extra-columns="extraCols"
        >
          <!-- Типизируем деструктуризацию: { item: CatalogItem } вместо any -->
          <template #cell(actions)="{ item }: { item: CatalogItem }">
            <div class="flex justify-center">
              <button class="btn btn-secondary btn-xs border-dark" @click="openEditor(item.idName)">
                🏷️ Этикетка
              </button>
            </div>
          </template>
        </SharedProductTable>
      </div>
    </div>

    <NamesLabelEditor v-model:is-open="isEditorOpen" :id-name="selectedIdName" />
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import SharedProductTable from '@/components/ui/CatalogTable.vue'
import NamesLabelEditor from '@/components/ui/NamesLabelEditor.vue'
import { catalogService, type CatalogItem } from '@/api/catalogService'
import { useAsync } from '@/composables/useAsync'
import type { TableColumn } from '@/components/ui/BaseTable.vue'

// Создаем строгую ссылку на компонент таблицы для доступа к triggerExcelExport
const tableRef = ref<InstanceType<typeof SharedProductTable> | null>(null)

const extraCols: TableColumn<CatalogItem>[] = [
  {
    key: 'actions' as keyof CatalogItem,
    label: 'Действия',
    width: '110px',
  },
]
const cards = ref<CatalogItem[]>([])
const { loading, run } = useAsync()
const isEditorOpen = ref(false)
const selectedIdName = ref(0)

const openEditor = (idName: number) => {
  selectedIdName.value = idName
  isEditorOpen.value = true
}

import * as XLSX from 'xlsx' // <-- Убедись, что импорт XLSX есть вверху файла

const exportToExcel = () => {
  if (!cards.value.length) return

  const dataToExport = cards.value.map((item) => {
    const barcodesStr = Array.isArray(item.barcodes)
      ? item.barcodes.join(', ')
      : item.barcode || '—'

    const row: Record<string, string | number> = {
      'ID товара': item.idName,
      Артикул: item.cArt || '—',
      'Арт. WB': item.cArtWB || '—',
      'Название товара': item.cName || 'Без названия',
      Размер: item.size || '—',
      'Штрихкод(ы)': barcodesStr,
    }
    return row
  })

  const worksheet = XLSX.utils.json_to_sheet(dataToExport)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Карточки товаров')

  const objectKeys = Object.keys(dataToExport[0])
  worksheet['!cols'] = objectKeys.map((key) => ({
    wch:
      Math.max(
        key.length,
        ...dataToExport.map(
          (row: Record<string, string | number>) => String(row[key] ?? '').length,
        ),
      ) + 3,
  }))

  XLSX.writeFile(workbook, `Карточки_товаров_${new Date().toLocaleDateString()}.xlsx`)
}

onMounted(() =>
  run(async () => {
    cards.value = await catalogService.getCards()
  }),
)
</script>
