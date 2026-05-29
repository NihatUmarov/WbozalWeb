<template>
  <MainLayout>
    <BaseDataPage
      title="Остатки товаров"
      :items="remains"
      :columns="columns"
      :loading="loading"
      :row-class="(item) => (item.isDefect ? 'row-defect' : '')"
      empty-text="Остатков не найдено"
      empty-icon="📦"
    >
      <template #header-actions>
        <ToggleSwitch v-model="filterDefect" label="Показать только брак" variant="defect" />
      </template>

      <template #cell(cArt)="{ value }"
        ><span class="text-primary font-semibold">{{ value || '—' }}</span></template
      >
      <template #cell(barcode)="{ value }"
        ><span class="font-mono text-secondary text-sm tracking-wide">{{
          value || '—'
        }}</span></template
      >
      <template #cell(cName)="{ value }"
        ><div class="truncate max-w-xs" :title="String(value || '')">
          {{ value || 'Без названия' }}
        </div></template
      >
      <template #cell(irQuant)="{ value }"
        ><span class="text-success font-semibold bg-success-subtle rounded px-2.5 py-1 text-xs">{{
          value
        }}</span></template
      >
      <template #cell(iBronTask)="{ value }"
        ><span class="text-warning font-medium bg-warning-subtle rounded px-2.5 py-1 text-xs">{{
          value || '—'
        }}</span></template
      >
      <template #cell(isDefect)="{ value }">
        <StatusBadge :variant="value ? 'error' : 'success'">{{
          value ? 'Брак' : 'Ок'
        }}</StatusBadge>
      </template>
    </BaseDataPage>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import MainLayout from '@/components/ui/MainLayout.vue'
import BaseDataPage from '@/components/ui/BaseDataPage.vue'
import { type TableColumn } from '@/components/ui/BaseTable.vue'
import ToggleSwitch from '@/components/ui/ToggleSwitch.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import { remainsService } from '@/api/remainsService'
import type { RemainItem } from '@/api/types'

const remains = ref<RemainItem[]>([])
const loading = ref(false)
const filterDefect = ref(false)

const columns: TableColumn<RemainItem>[] = [
  { key: 'cArt', label: 'Артикул', sortable: true, filterable: true },
  { key: 'barcode', label: 'Штрихкод', sortable: true, filterable: true },
  { key: 'cName', label: 'Название', sortable: true, filterable: true },
  { key: 'irQuant', label: 'Доступно (шт.)', sortable: true },
  { key: 'iBronTask', label: 'В резерве', sortable: true },
  { key: 'isDefect', label: 'Состояние', sortable: true },
]

const fetchRemains = async () => {
  loading.value = true
  try {
    remains.value = await remainsService.getRemains(filterDefect.value)
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

onMounted(fetchRemains)
</script>
