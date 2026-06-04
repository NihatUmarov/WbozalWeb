<template>
  <MainLayout>
    <BaseDataPage
      title="Остатки товаров"
      :items="remains"
      :columns="columns"
      :loading="loading"
      :row-class="(item) => (item.isDefect ? 'bg-error-subtle/30' : '')"
      empty-text="Остатков не найдено"
      empty-icon="📦"
    >
      <template #header-actions>
        <ToggleSwitch
          v-model="filterDefect"
          label="Показать только брак"
          variant="defect"
          @update:model-value="fetchRemains"
        />
      </template>

      <template #cell(cArt)="{ value }">
        <span
          class="font-mono text-xs bg-secondary text-primary font-semibold px-2 py-0.5 rounded border border-border"
        >
          {{ value || '—' }}
        </span>
      </template>

      <template #cell(barcode)="{ value }">
        <span
          class="font-mono text-secondary text-xs tracking-wider bg-surface px-1.5 py-0.5 rounded border border-border/40"
        >
          {{ value || '—' }}
        </span>
      </template>

      <template #cell(cName)="{ value }">
        <div
          class="truncate max-w-md text-sm font-medium text-primary py-1"
          :title="String(value || '')"
        >
          {{ value || 'Без названия' }}
        </div>
      </template>

      <template #cell(irQuant)="{ value }">
        <span
          v-if="Number(value) > 0"
          class="text-success font-bold bg-success-subtle rounded px-2.5 py-1 text-xs tabular-nums border border-success/10"
        >
          {{ value }} шт.
        </span>
        <span v-else class="text-border text-xs font-medium tabular-nums">0 шт.</span>
      </template>

      <template #cell(iBronTask)="{ value }">
        <span
          v-if="Number(value) > 0"
          class="text-warning font-semibold bg-warning-subtle rounded px-2.5 py-1 text-xs tabular-nums border border-warning/10"
        >
          {{ value }} шт.
        </span>
        <span v-else class="text-border text-xs font-medium tabular-nums">—</span>
      </template>

      <template #cell(isDefect)="{ value }">
        <StatusBadge :variant="value ? 'error' : 'success'">
          {{ value ? 'Брак' : 'Исправен' }}
        </StatusBadge>
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
import { useAsync } from '@/composables/useAsync'
import type { RemainItem } from '@/api/types'

const remains = ref<RemainItem[]>([])
const filterDefect = ref(false)
const { loading, run } = useAsync()

const columns: TableColumn<RemainItem>[] = [
  { key: 'cArt', label: 'Артикул', sortable: true, filterable: true, width: '140px' },
  { key: 'barcode', label: 'Штрихкод', sortable: true, filterable: true, width: '180px' },
  { key: 'cName', label: 'Название товара', sortable: true, filterable: true, minWidth: '300px' },
  { key: 'irQuant', label: 'Доступно', sortable: true, width: '130px' },
  { key: 'iBronTask', label: 'В резерве', sortable: true, width: '130px' },
  { key: 'isDefect', label: 'Состояние', sortable: true, width: '120px' },
]

const fetchRemains = () => {
  run(async () => {
    remains.value = await remainsService.getRemains(filterDefect.value)
  })
}

onMounted(fetchRemains)
</script>
