<template>
  <MainLayout>
    <div class="flex flex-col gap-16 p-16">
      <div class="card flex flex-wrap items-center justify-between gap-12 p-16">
        <h2 class="text-xl font-bold text-primary m-0">Остатки товаров</h2>
        <div class="flex items-center gap-16">
          <label class="toggle toggle-defect m-0">
            <input type="checkbox" v-model="filterDefect" @change="fetchRemains" />
            <div class="toggle-track"></div>
            <span>Показать только брак</span>
          </label>
          <button class="btn btn-secondary flex items-center gap-8">
            <img src="@/components/icons/office-exel.svg" alt="Excel" width="16" height="16" />
            <span>Выгрузить в Excel</span>
          </button>
        </div>
      </div>

      <div class="card no-padding overflow-hidden">
        <SharedProductTable
          :items="remains"
          :loading="loading"
          :hide-columns="['defectQuant']"
          :extra-columns="extraCols"
        >
          <template #cell(isDefect)="{ item }">
            <span :class="['badge', (item as any).isDefect ? 'badge--error' : 'badge--success']">
              {{ (item as any).isDefect ? 'Брак' : 'Активен' }}
            </span>
          </template>
        </SharedProductTable>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import MainLayout from '@/components/ui/MainLayout.vue'
import SharedProductTable from '@/components/ui/SharedProductTable.vue'
import { catalogService, type CatalogItem } from '@/api/catalogService'
import { useAsync } from '@/composables/useAsync'
import type { TableColumn } from '@/components/ui/BaseTable.vue'

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

onMounted(fetchRemains)
</script>
