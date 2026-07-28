<!-- NamesLabelEditor.vue -->
<template>
  <BaseDialog
    :is-open="isOpen"
    variant="modal"
    max-width="7xl"
    @update:is-open="(val) => emit('update:isOpen', val)"
  >
    <template #header>
      <h2 class="text-xl font-bold m-0 flex items-center gap-12">
        Редактор этикетки
        <span v-if="templateData?.isCustom" class="badge badge--success">Кастомная</span>
        <span v-else class="badge badge--neutral">По умолчанию</span>
      </h2>
    </template>

    <div v-if="isLoading" class="flex justify-center py-40">
      <div class="modal-spin-loader"></div>
    </div>

    <div v-else-if="templateData" class="editor-grid">
      <div class="settings-panel flex-col gap-24">
        <div class="input-group">
          <label class="input-label">Размер и тип этикетки</label>
          <select v-model="templateData.cLabelType" class="input" @change="reloadTemplate">
            <option value="60x40">60x40 (Стандарт)</option>
            <option value="40x30">40x30 (Малая)</option>
            <option value="60x40Kiz">60x40 + КИЗ (Честный Знак)</option>
          </select>
        </div>

        <div class="element-list flex-col gap-8 border-t pt-16">
          <label class="input-label">Элементы на этикетке</label>
          <div
            v-for="(el, idx) in templateData.elements"
            :key="idx"
            class="element-item"
            :class="{ active: selectedIndex === idx }"
            @click="selectedIndex = idx"
          >
            <div class="flex items-center justify-between">
              <span class="font-semibold text-sm">{{ getElementTitle(el.field) }}</span>
              <span class="badge badge--info">{{ el.type }}</span>
            </div>
          </div>
        </div>

        <div v-if="selectedElement" class="properties-box card flex-col gap-16 mt-12 bg-secondary">
          <h3 class="m-0 text-base">Свойства: {{ getElementTitle(selectedElement.field) }}</h3>

          <div class="grid-col-2 gap-12">
            <div v-for="meta in elementLayoutMeta" :key="meta.key" class="input-group">
              <label class="input-label text-xs">{{ meta.label }}</label>
              <input
                type="number"
                v-model.number="(selectedElement as Record<string, any>)[meta.key]"
                class="input"
              />
            </div>
          </div>

          <div v-if="selectedElement.type === 'text'" class="grid-col-2 gap-12">
            <div class="input-group">
              <label class="input-label text-xs">Размер шрифта</label>
              <input type="number" v-model.number="selectedElement.fontSize" class="input" />
            </div>
            <div class="input-group">
              <label class="input-label text-xs">Префикс</label>
              <input
                type="text"
                v-model="selectedElement.prefix"
                class="input"
                placeholder="Напр: Арт: "
              />
            </div>
          </div>

          <label v-if="selectedElement.type === 'text'" class="toggle mt-4">
            <input type="checkbox" v-model="selectedElement.isBold" />
            <div class="toggle-track"></div>
            <span>Жирный шрифт</span>
          </label>
        </div>
      </div>

      <div
        class="preview-panel flex justify-center items-center bg-secondary rounded-6 border-dark"
      >
        <div
          class="canvas-wrapper"
          :style="{ width: canvasSize.width + 'px', height: canvasSize.height + 'px' }"
        >
          <div
            v-for="(el, idx) in templateData.elements"
            :key="idx"
            class="canvas-element"
            :class="{ 'is-selected': selectedIndex === idx }"
            :style="getElementStyles(el)"
            @click="selectedIndex = idx"
          >
            <template v-if="el.type === 'text'">
              {{ el.prefix || '' }}{{ getMockValue(el.field) }}
            </template>
            <template v-else-if="el.type === 'barcode'">
              <div class="mock-barcode flex-col items-center justify-center w-full h-full">
                <div class="bars w-full flex-1"></div>
                <span class="text-xs font-mono font-bold mt-4">{{ getMockValue(el.field) }}</span>
              </div>
            </template>
            <template v-else-if="el.type === 'datamatrix'">
              <div class="mock-datamatrix"></div>
            </template>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <button class="btn btn-secondary" :disabled="isSaving" @click="close">Отмена</button>
      <button class="btn btn-primary" :disabled="isSaving || !templateData" @click="saveTemplate">
        <div v-if="isSaving" class="btn-spinner"></div>
        <span v-else>Сохранить шаблон</span>
      </button>
    </template>
  </BaseDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import BaseDialog from './UnifiedUI.vue'
import { productService, type LabelTemplate, type LabelElement } from '@/api/productService'

export interface CardDetailItemExt {
  cName?: string
  cArt?: string
  barcodes: string[]
  cJurperson?: string
  brandName?: string
}

const props = defineProps<{
  isOpen: boolean
  idName: number
  productInfo?: CardDetailItemExt
}>()

const emit = defineEmits<{
  (e: 'update:isOpen', value: boolean): void
  (e: 'saved'): void
}>()

const isLoading = ref(false)
const isSaving = ref(false)
const templateData = ref<LabelTemplate | null>(null)
const selectedIndex = ref<number | null>(null)

const elementLayoutMeta = [
  { key: 'x', label: 'Ось X (px)' },
  { key: 'y', label: 'Ось Y (px)' },
  { key: 'w', label: 'Ширина (px)' },
  { key: 'h', label: 'Высота (px)' },
] as const

const selectedElement = computed((): LabelElement | null => {
  if (selectedIndex.value === null || !templateData.value) return null
  return templateData.value.elements[selectedIndex.value]
})

const canvasSize = computed(() => {
  const type = templateData.value?.cLabelType || '60x40'
  return type === '40x30' ? { width: 320, height: 240 } : { width: 480, height: 320 }
})

const loadData = async (defaultType = '60x40') => {
  if (!props.idName) return
  isLoading.value = true
  selectedIndex.value = null
  templateData.value = await productService.getLabelTemplate(props.idName, defaultType)
  isLoading.value = false
}

const reloadTemplate = () => {
  if (templateData.value) loadData(templateData.value.cLabelType)
}

const saveTemplate = async () => {
  if (!templateData.value) return
  isSaving.value = true
  await productService.saveLabelTemplate({
    idName: templateData.value.idName,
    cLabelType: templateData.value.cLabelType,
    elements: templateData.value.elements,
  })
  isSaving.value = false
  emit('saved')
  close()
}

const close = () => emit('update:isOpen', false)

watch(
  () => props.isOpen,
  (val) => {
    if (val) loadData()
  },
)

const getElementTitle = (field: string): string => {
  const map: Record<string, string> = {
    cName: 'Название товара',
    cArt: 'Артикул',
    Barcode: 'Штрихкод',
    Kiz: 'Честный Знак (КИЗ)',
    cJurperson: 'Продавец / ИП',
    BrandName: 'Бренд',
  }
  return map[field] || field
}

const getMockValue = (field: string): string => {
  if (props.productInfo) {
    if (field === 'cName') return props.productInfo.cName || 'Без названия'
    if (field === 'cArt') return props.productInfo.cArt || 'Без артикула'
    if (field === 'cJurperson') return props.productInfo.cJurperson || 'Не указан ИП'
    if (field === 'BrandName') return props.productInfo.brandName || 'Без бренда'
    if (field === 'Barcode' && props.productInfo.barcodes?.length)
      return props.productInfo.barcodes[0]
  }
  const mocks: Record<string, string> = {
    cName: 'Свитер вязаный оверсайз (Тест)',
    cArt: 'ART-999-WMS',
    Barcode: '2000000123456',
    Kiz: '01046...21xyz',
    cJurperson: 'ИП Иванов И.И.',
    BrandName: 'SUPERBRAND',
  }
  return mocks[field] || 'Данные'
}

const getElementStyles = (el: LabelElement) => ({
  left: `${el.x}px`,
  top: `${el.y}px`,
  width: `${el.w}px`,
  height: `${el.h}px`,
  fontSize: `${el.fontSize}px`,
  fontWeight: el.isBold ? 'bold' : 'normal',
  fontFamily: el.type === 'text' ? 'Arial, sans-serif' : 'inherit',
  lineHeight: '1.1',
})
</script>

<style scoped>
.editor-grid {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: var(--spacing-24);
  height: 60vh;
  min-height: 520px;
}
.settings-panel {
  overflow-y: auto;
  padding-right: var(--spacing-8);
  scrollbar-width: thin;
}
.element-item {
  padding: var(--spacing-12);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-8);
  cursor: pointer;
  transition: all var(--transition-fast);
  background: var(--color-surface);
}
.element-item:hover {
  border-color: var(--color-text-tertiary);
}
.element-item.active {
  border-color: var(--color-primary);
  background: var(--color-primary-subtle);
}
.properties-box {
  padding: var(--spacing-16);
}
.preview-panel {
  overflow: auto;
}
.canvas-wrapper {
  position: relative;
  background: white;
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--color-border-dark);
  transform-origin: center center;
}
.canvas-element {
  position: absolute;
  border: 1px dashed transparent;
  display: flex;
  cursor: pointer;
  user-select: none;
  color: black;
  overflow: hidden;
  word-wrap: break-word;
}
.canvas-element:hover {
  border-color: rgba(79, 70, 229, 0.4);
}
.canvas-element.is-selected {
  border-color: var(--color-primary);
  background: rgba(79, 70, 229, 0.05);
}
.mock-barcode .bars {
  background: repeating-linear-gradient(
    90deg,
    black,
    black 2px,
    white 2px,
    white 4px,
    black 4px,
    black 7px,
    white 7px,
    white 9px
  );
}
.mock-datamatrix {
  width: 100%;
  height: 100%;
  background-image:
    linear-gradient(45deg, black 25%, transparent 25%, transparent 75%, black 75%, black),
    linear-gradient(45deg, black 25%, transparent 25%, transparent 75%, black 75%, black);
  background-size: 10px 10px;
  background-position:
    0 0,
    5px 5px;
  border: 2px solid black;
}
</style>
