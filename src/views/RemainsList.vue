<template>
  <MainLayout>
    <BaseDataPage
      title="Остатки товаров"
      :items="remains"
      :loading="loading"
      :columns="extraCols"
    >
      <template #header-actions>
        <label class="toggle toggle-defect m-0">
          <input type="checkbox" v-model="filterDefect" @change="fetchRemains" />
          <div class="toggle-track"></div>
          <span>Показать только брак</span>
        </label>
      </template>

      <template #default="{ registerTable }">
        <SharedProductTable
          :ref="registerTable"
          :items="remains"
          :loading="loading"
          :hide-columns="['defectQuant']"
          :extra-columns="extraCols"
        >
          <template #cell(isDefect)="{ item }">
            <div class="flex justify-center">
              <AppBadge
                :variant="item.isDefect ? 'error' : 'success'"
                :text="item.isDefect ? 'Брак' : 'Активен'"
              />
            </div>
          </template>
        </SharedProductTable>
      </template>
    </BaseDataPage>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, shallowRef } from 'vue'
import BaseDataPage from '@/components/ui/BaseDataPage.vue'
import SharedProductTable from '@/components/ui/CatalogTable.vue'
import { AppBadge, type TableColumn } from '@/components/ui/BaseTable.vue'
import { productService } from '@/api/productService'
import { useAsync } from '@/composables/useAsync'
import type { Product } from '@/api/types'

const remains = shallowRef<Product[]>([])
const filterDefect = ref(false)
const { loading, run } = useAsync()

const extraCols: TableColumn<Product>[] = [
  { key: 'isDefect', label: 'Состояние', sortable: true, width: '120px' },
]

const fetchRemains = () => run(async () => {
  remains.value = await productService.getRemains(filterDefect.value)
})

onMounted(fetchRemains)
</script>
