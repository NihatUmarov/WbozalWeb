<template>
  <MainLayout>
    <div class="flex flex-col gap-16 p-16">
      <!-- Шапка страницы -->
      <div class="card flex flex-wrap items-center justify-between gap-12 p-16">
        <h2 class="text-xl font-bold text-primary m-0">Карточки товаров (МультиШК)</h2>

        <div class="flex items-center gap-12">
          <!-- КНОПКА МАССОВОГО ОБНОВЛЕНИЯ КОМПЛЕКТОВ -->
          <button class="btn btn-primary flex items-center gap-8" @click="isBulkImportOpen = true">
            <span>Обновление комплектов</span>
          </button>

          <button class="btn btn-secondary flex items-center gap-8" @click="exportToExcel">
            <img src="@/components/icons/office-exel.svg" alt="Excel" width="16" height="16" />
            <span>Выгрузить in Excel</span>
          </button>
        </div>
      </div>

      <!-- СИСТЕМНЫЕ ТАБЫ -->
      <div class="page-tabs">
        <button
          :class="['tab-btn', { 'tab-btn--active': activeTab === 'items' }]"
          @click="activeTab = 'items'"
        >
          Карточки
        </button>
        <button
          :class="['tab-btn', { 'tab-btn--active': activeTab === 'kits' }]"
          @click="activeTab = 'kits'"
        >
          Комплекты
        </button>
      </div>

      <!-- Основная таблица -->
      <div class="card no-padding overflow-hidden">
        <SharedProductTable
          ref="tableRef"
          :items="displayedCards"
          :loading="loading"
          :extra-columns="extraCols"
          @row-click="onProductClick"
        >
          <template #cell(actions)="{ item }: { item: CatalogItem }">
            <div class="flex justify-center">
              <button
                class="btn btn-secondary btn-xs border-dark"
                @click.stop="openEditor(item.idName)"
              >
                🏷️ Этикетка
              </button>
            </div>
          </template>
        </SharedProductTable>
      </div>
    </div>

    <!-- Модальное окно редактора этикеток -->
    <NamesLabelEditor v-model:is-open="isEditorOpen" :id-name="selectedIdName" />

    <!-- МОДАЛЬНОЕ ОКНО: Детали + Сборка комплекта -->
    <BaseDialog v-model:is-open="isDetailOpen" variant="modal" max-width="4xl">
      <template #header>
        <h2 class="text-xl font-bold m-0">Управление номенклатурой</h2>
      </template>
      <ProductDetailModal
        v-if="selectedIdNameForView && isDetailOpen"
        :id-name="selectedIdNameForView"
        :all-cards="cardsAsCardItems"
        @updated="handleDetailUpdated"
      />
    </BaseDialog>

    <!-- МОДАЛЬНОЕ ОКНО: Массовый импорт/обновление комплектов через Excel -->
    <BaseDialog v-model:is-open="isBulkImportOpen" variant="modal" max-width="2xl">
      <template #header>
        <h2 class="text-xl font-bold m-0">Массовое обновление комплектов</h2>
      </template>
      <KitBulkImportModal
        v-if="isBulkImportOpen"
        :catalog-cards="cardsAsCardItems"
        @close="isBulkImportOpen = false"
        @updated="handleBulkUpdated"
      />
    </BaseDialog>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, type ComponentPublicInstance } from 'vue' // <--- ДОБАВИЛИ СУДА
import SharedProductTable from '@/components/ui/CatalogTable.vue'
import NamesLabelEditor from '@/components/ui/NamesLabelEditor.vue'
import BaseDialog from '@/components/ui/UnifiedUI.vue'
import ProductDetailModal from '@/components/ui/ProductDetailModal.vue'
import KitBulkImportModal from '@/components/modals/KitBulkImportModal.vue'
import { catalogService, type CatalogItem } from '@/api/catalogService'
import { useAsync } from '@/composables/useAsync'
import type { TableColumn } from '@/components/ui/BaseTable.vue'
import type { CardItem } from '@/api/cardsService'

interface ExtendedCatalogItem extends CatalogItem {
  isKit?: boolean
}

// 1. Интерфейс того, что экспортирует CatalogTable (SharedProductTable)
interface CatalogTableExpose {
  triggerExcelExport: (fileName: string) => void
  getScrollTop: () => number
  setScrollTop: (top: number) => void
}

// 2. Ссылка на компонент таблицы с правильным типом
const tableRef = ref<(ComponentPublicInstance & CatalogTableExpose) | null>(null)

type TabType = 'items' | 'kits'
const activeTab = ref<TabType>('items')

const extraCols: TableColumn<CatalogItem>[] = [
  { key: 'actions' as keyof CatalogItem, label: 'Действия', width: '110px' },
]

const cards = ref<ExtendedCatalogItem[]>([])
const { loading, run } = useAsync()

const isEditorOpen = ref(false)
const selectedIdName = ref(0)

const isDetailOpen = ref(false)
const selectedIdNameForView = ref<number | null>(null)

const isBulkImportOpen = ref(false)

// 3. Выгрузка в Excel
const exportToExcel = () => {
  if (tableRef.value) {
    const fileName = activeTab.value === 'kits' ? 'Комплекты товаров' : 'Одиночные товары'
    tableRef.value.triggerExcelExport(fileName)
  }
}

const displayedCards = computed(() => {
  if (activeTab.value === 'kits') {
    return cards.value.filter((card) => card.isKit === true)
  }
  return cards.value.filter((card) => !card.isKit)
})

const cardsAsCardItems = computed<CardItem[]>(() => {
  return cards.value.map((card) => {
    const extractedBarcodes: string[] = Array.isArray(card.barcodes)
      ? card.barcodes
      : card.barcode
        ? [card.barcode]
        : []

    return {
      idName: card.idName,
      cName: card.cName ?? null,
      cArt: card.cArt ?? null,
      primaryImageURL: card.primaryImageURL ?? null,
      cArtWB: card.cArtWB ?? null,
      size: card.size ?? null,
      barcodes: extractedBarcodes,
      irQuant: card.irQuant ?? 0,
      iBronTask: card.iBronTask ?? 0,
      defectQuant: card.defectQuant ?? 0,
      isKit: !!card.isKit,
    }
  })
})

const openEditor = (idName: number) => {
  selectedIdName.value = idName
  isEditorOpen.value = true
}

const onProductClick = (item: CatalogItem) => {
  selectedIdNameForView.value = item.idName
  isDetailOpen.value = true
}

const fetchCards = async () => {
  const savedScrollTop = tableRef.value?.getScrollTop() || 0

  await run(async () => {
    cards.value = (await catalogService.getCards()) as ExtendedCatalogItem[]
  })

  await nextTick()
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      tableRef.value?.setScrollTop(savedScrollTop)
    })
  })
}

const handleDetailUpdated = () => {
  isDetailOpen.value = false
  fetchCards()
}

const handleBulkUpdated = () => {
  isBulkImportOpen.value = false
  fetchCards()
}

onMounted(fetchCards)
</script>
