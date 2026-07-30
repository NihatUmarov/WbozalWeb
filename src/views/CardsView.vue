<template>
  <MainLayout>
    <BaseDataPage
      ref="dataPageRef"
      title="Карточки товаров"
      :items="displayedCards"
      :loading="loading"
      :columns="extraCols"
      :tabs="[
        { label: 'Карточки', value: 'items' },
        { label: 'Комплекты', value: 'kits' }
      ]"
      :current-tab="activeTab"
      @tab-change="activeTab = $event as any"
    >
      <template #header-actions>
        <button class="btn btn-primary flex items-center gap-8" @click="isBulkImportOpen = true">
          <span>📦 Обновить комплекты</span>
        </button>
      </template>

      <!-- Основная таблица (передаем слоты в BaseTable внутри BaseDataPage) -->
      <template #default="{ registerTable }">
        <SharedProductTable
          :ref="registerTable"
          :items="displayedCards"
          :loading="loading"
          :extra-columns="extraCols"
          @row-click="onProductClick"
        >
          <template #cell(actions)="{ item }">
            <div class="flex justify-center">
              <button class="btn btn-secondary btn-xs border-dark" @click.stop="openEditor(item.idName)">
                🏷️ Этикетка
              </button>
            </div>
          </template>
        </SharedProductTable>
      </template>

      <template #row-details="{ item, close }">
         <ProductDetailModal
          v-if="item"
          :id-name="item.idName"
          :all-cards="cards"
          @updated="handleDetailUpdated(close)"
        />
      </template>
    </BaseDataPage>

    <!-- Дополнительные модалки -->
    <NamesLabelEditor v-model:is-open="isEditorOpen" :id-name="selectedIdName" />

    <BaseDialog v-model:is-open="isBulkImportOpen" variant="modal" max-width="2xl">
      <template #header><h2 class="text-xl font-bold m-0">Массовое обновление комплектов</h2></template>
      <KitBulkImportModal
        v-if="isBulkImportOpen"
        :catalog-cards="cards"
        @close="isBulkImportOpen = false"
        @updated="fetchCards"
      />
    </BaseDialog>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, shallowRef } from 'vue'
import BaseDataPage from '@/components/ui/BaseDataPage.vue'
import SharedProductTable from '@/components/ui/CatalogTable.vue'
import NamesLabelEditor from '@/components/ui/NamesLabelEditor.vue'
import BaseDialog from '@/components/ui/UnifiedUI.vue'
import ProductDetailModal from '@/components/ui/ProductDetailModal.vue'
import KitBulkImportModal from '@/components/modals/KitBulkImportModal.vue'
import { productService } from '@/api/productService'
import { useAsync } from '@/composables/useAsync'
import type { Product } from '@/api/types'
import type { TableColumn } from '@/components/ui/BaseTable.vue'

const activeTab = ref<'items' | 'kits'>('items')
const cards = shallowRef<Product[]>([])
const isEditorOpen = ref(false)
const selectedIdName = ref(0)
const isBulkImportOpen = ref(false)
const dataPageRef = ref<{ openRowDetails: (item: Product) => void } | null>(null)

const { loading, run } = useAsync()

const extraCols: TableColumn<Product>[] = [
  { key: 'actions', label: 'Действия', width: '110px' },
]

const displayedCards = computed(() =>
  cards.value.filter(c => activeTab.value === 'kits' ? c.isKit : !c.isKit)
)

const fetchCards = () => run(async () => {
  cards.value = await productService.getProducts()
})

const onProductClick = (item: Product) => {
  dataPageRef.value?.openRowDetails(item)
}

const openEditor = (idName: number) => {
  selectedIdName.value = idName
  isEditorOpen.value = true
}

const handleDetailUpdated = (close: () => void) => {
  close()
  fetchCards()
}

onMounted(fetchCards)
</script>
