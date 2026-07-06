<template>
  <div class="flex flex-col gap-16 p-16">
    <div class="card flex flex-wrap items-center justify-between gap-12 p-16">
      <h2 class="text-xl font-bold text-primary m-0">Остатки товаров</h2>
      <div class="flex items-center gap-16">
        <label class="toggle toggle-defect m-0">
          <input type="checkbox" v-model="filterDefect" @change="fetchRemains" />
          <div class="toggle-track"></div>
          <span>Показать только брак</span>
        </label>
        <button class="btn btn-secondary flex items-center gap-8" @click="exportToExcel">
          <img src="@/components/icons/office-exel.svg" alt="Excel" width="16" height="16" />
          <span>Выгрузить в Excel</span>
        </button>
      </div>
    </div>

    <div class="card no-padding overflow-hidden">
      <SharedProductTable
        ref="tableRef"
        :items="remains"
        :loading="loading"
        :hide-columns="['defectQuant']"
        :extra-columns="extraCols"
      >
        <!-- Типизируем деструктуризацию: { item: CatalogItem } вместо any -->
        <template #cell(isDefect)="{ item }: { item: CatalogItem }">
          <span :class="['badge', item.isDefect ? 'badge--error' : 'badge--success']">
            {{ item.isDefect ? 'Брак' : 'Активен' }}
          </span>
        </template>
      </SharedProductTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import SharedProductTable from '@/components/ui/CatalogTable.vue'
import { catalogService, type CatalogItem } from '@/api/catalogService'
import { useAsync } from '@/composables/useAsync'
import type { TableColumn } from '@/components/ui/BaseTable.vue'

// Создаем строгую ссылку на компонент таблицы для доступа к triggerExcelExport
const tableRef = ref<InstanceType<typeof SharedProductTable> | null>(null)

const extraCols: TableColumn<CatalogItem>[] = [
  {
    key: 'isDefect' as keyof CatalogItem,
    label: 'Состояние',
    sortable: true,
    width: '120px',
  },
]
const remains = ref<CatalogItem[]>([])
const filterDefect = ref(false)
const { loading, run } = useAsync()

const fetchRemains = () =>
  run(async () => {
    remains.value = await catalogService.getRemains(filterDefect.value)
  })

import * as XLSX from 'xlsx' // <-- Убедись, что импорт XLSX есть вверху файла

const exportToExcel = () => {
  if (!remains.value.length) return

  const dataToExport = remains.value.map((item) => {
    const barcodesStr = Array.isArray(item.barcodes)
      ? item.barcodes.join(', ')
      : item.barcode || '—'

    const row: Record<string, string | number> = {
      Артикул: item.cArt || '—',
      'Арт. WB': item.cArtWB || '—',
      'Название товара': item.cName || 'Без названия',
      Размер: item.size || '—',
      'Штрихкод(ы)': barcodesStr,
      Доступно: item.irQuant ?? 0,
      'В резерве': item.iBronTask ?? 0,
      Брак: item.defectQuant ?? 0,
      Состояние: item.isDefect ? 'Брак' : 'Активен',
    }
    return row
  })

  const worksheet = XLSX.utils.json_to_sheet(dataToExport)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Остатки')

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

  XLSX.writeFile(workbook, `Остатки_товаров_${new Date().toLocaleDateString()}.xlsx`)
}

onMounted(fetchRemains)
</script>
