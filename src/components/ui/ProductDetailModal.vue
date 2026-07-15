<template>
  <div class="flex flex-col relative" style="min-height: 400px; padding: 20px">
    <div
      v-if="loading"
      class="absolute inset-0 flex items-center justify-center bg-surface z-10"
      style="opacity: 0.8"
    >
      <div class="modal-spin-loader"></div>
    </div>

    <div v-else-if="details" class="flex flex-col gap-24">
      <!-- ВЕРХНИЙ БЛОК (Карточка товара горизонтально) -->
      <div class="flex gap-20 items-start">
        <!-- Фото товара -->
        <div
          class="shrink-0 bg-secondary border-dark rounded-8 flex items-center justify-center overflow-hidden"
          style="width: 140px; height: 160px; padding: 12px"
        >
          <img
            v-if="details?.primaryImageURL"
            :src="details?.primaryImageURL"
            class="w-full h-full"
            style="object-fit: contain"
            alt="Товар"
          />
          <span class="text-2xl" v-else>📦</span>
        </div>

        <!-- Информация и метрики (справа) -->
        <div class="flex flex-col flex-1 gap-12 min-w-0">
          <div class="flex flex-col gap-6">
            <h3 class="text-base font-bold m-0 text-primary truncate">
              {{ details?.cName || 'Без названия' }}
            </h3>
            <div class="flex items-center gap-8 text-xs flex-wrap">
              <span class="text-muted font-mono font-medium">ID: {{ details?.idName }}</span>
              <span class="text-muted"
                >Арт:
                <span class="font-bold text-primary font-mono">{{
                  details?.cArt || '—'
                }}</span></span
              >
              <span v-if="details?.isKit" class="badge badge--info py-4 px-6">📦 Комплект</span>
            </div>
          </div>

          <!-- Плашка показателей WMS -->
          <div class="flex gap-24 bg-secondary border-dark rounded-8" style="padding: 16px">
            <div class="flex flex-col gap-4">
              <span class="text-xs text-muted uppercase font-bold tracking-wider">Остаток WMS</span>
              <span class="text-sm font-bold text-success">{{ details?.irQuant }} шт.</span>
            </div>
            <div class="flex flex-col gap-4">
              <span class="text-xs text-muted uppercase font-bold tracking-wider"
                >Габариты (ДхШхВ)</span
              >
              <span class="text-sm font-bold text-primary"
                >{{ details?.length }}×{{ details?.width }}×{{ details?.height }}</span
              >
            </div>
            <div class="flex flex-col gap-4">
              <span class="text-xs text-muted uppercase font-bold tracking-wider">Объем</span>
              <span class="text-sm font-bold text-primary">{{ details?.volumeLiter }} л</span>
            </div>
          </div>
        </div>
      </div>

      <hr class="border-border my-0" />

      <!-- НИЖНИЙ БЛОК: ИНТЕРФЕЙС ПОДТВЕРЖДЕНИЯ УДАЛЕНИЯ КАРТОЧКИ (ЕСЛИ АКТИВЕН) -->
      <div
        v-if="isConfirmDeleteOpen"
        class="flex flex-col gap-12 p-16 bg-secondary border-dark rounded-8"
      >
        <h4 class="text-xs font-bold uppercase tracking-wider text-error m-0">
          ⚠️ Подтверждение удаления карточки товара
        </h4>

        <div class="text-sm text-primary py-4">
          Вы уверены, что хотите полностью удалить карточку
          <span class="font-bold">"{{ details?.cName || 'Без названия' }}"</span>? Данное действие
          необратимо, остатки будут занулены, а связи с маркетплейсами WB и Ozon будут разорваны.
        </div>

        <div class="flex justify-end gap-12 border-t pt-12 mt-4">
          <button
            class="btn btn-xs btn-secondary"
            :disabled="isSaving"
            @click="isConfirmDeleteOpen = false"
          >
            Отмена
          </button>
          <button
            class="btn btn-xs btn-danger-soft"
            :disabled="isSaving"
            @click="executeCardDelete"
          >
            <div v-if="isSaving" class="btn-spinner"></div>
            <span v-else>Да, удалить карточку полностью</span>
          </button>
        </div>
      </div>

      <!-- НИЖНИЙ БЛОК: СТАНДАРТНОЕ УПРАВЛЕНИЕ КОМПЛЕКТОМ (ЕСЛИ НЕ УДАЛЯЕМ) -->
      <div v-else class="flex flex-col gap-12">
        <div class="flex items-center justify-between">
          <h4 class="text-xs font-bold uppercase tracking-wider text-muted m-0">
            Состав комплекта:
          </h4>
          <div class="flex items-center gap-8" v-if="!isEditing">
            <!-- Кнопка удаления теперь просто переключает режим прямо тут -->
            <button
              class="btn btn-danger-soft btn-xs"
              :disabled="isSaving"
              @click="isConfirmDeleteOpen = true"
            >
              🗑️ Удалить карточку
            </button>
            <button class="btn btn-secondary btn-xs border-dark" @click="toggleEdit(true)">
              {{ details?.isKit ? 'Изменить комплект' : 'Создать комплект' }}
            </button>
          </div>
        </div>

        <!-- 1. РЕЖИМ ПРОСМОТРА (Широкие строки) -->
        <div v-if="!isEditing" class="flex flex-col gap-8">
          <div
            v-if="!details?.isKit"
            class="text-xs text-muted bg-secondary rounded-8 border-dark text-center"
            style="padding: 24px"
          >
            Это стандартный товар. Нажмите «Создать комплект», чтобы добавить в него вложения.
          </div>

          <div
            v-else
            class="flex flex-col gap-8 overflow-hidden"
            style="max-height: 260px; overflow-y: auto"
          >
            <div
              v-for="comp in details?.components"
              :key="comp.idName"
              class="flex items-center gap-12 border-dark rounded-8 bg-surface"
              style="padding: 12px 16px"
            >
              <div
                class="shrink-0 bg-secondary border-dark rounded-6 overflow-hidden flex items-center justify-center"
                style="width: 48px; height: 48px; padding: 4px"
              >
                <img
                  v-if="comp.primaryImageURL"
                  :src="comp.primaryImageURL"
                  style="object-fit: contain; width: 100%; height: 100%"
                />
                <span class="text-xs" v-else>📦</span>
              </div>
              <div class="flex flex-col flex-1 min-w-0 gap-4">
                <span class="text-sm font-bold text-primary truncate">{{
                  comp.cName || 'Без названия'
                }}</span>
                <span class="text-xs text-muted font-mono">Арт: {{ comp.cArt || '—' }}</span>
              </div>
              <span class="badge badge--neutral font-bold font-mono shrink-0 py-4 px-6"
                >x {{ comp.qty }} шт.</span
              >
            </div>
          </div>
        </div>

        <!-- 2. РЕЖИМ РЕДАКТИРОВАНИЯ -->
        <div
          v-else
          class="flex flex-col gap-16 bg-primary-subtle border-dark rounded-8"
          style="padding: 16px; border-color: var(--color-primary)"
        >
          <!-- ИНЛАЙН АВТОКОМПЛИТ -->
          <div class="autocomplete-wrapper" ref="autocompleteWrapperRef">
            <div class="input-group">
              <label class="input-label text-xs">Добавить товар в комплект</label>
              <input
                type="text"
                v-model="searchQuery"
                class="input"
                placeholder="Начните вводить артикул или название..."
                @focus="isDropdownOpen = true"
              />
            </div>

            <Transition name="dropdown-fade">
              <div v-if="isDropdownOpen && filteredCards.length" class="autocomplete-dropdown">
                <div
                  v-for="card in filteredCards"
                  :key="card.idName"
                  class="autocomplete-item"
                  @click="addComponent(card)"
                >
                  <span class="font-mono font-bold text-primary">[{{ card.cArt || '—' }}]</span>
                  <span class="flex-1 truncate">{{ card.cName || 'Без названия' }}</span>
                  <span class="text-xs text-muted">ID: {{ card.idName }}</span>
                </div>
              </div>
              <div
                v-else-if="isDropdownOpen && searchQuery.trim()"
                class="autocomplete-dropdown text-center text-muted text-xs"
                style="padding: 12px"
              >
                Ничего не найдено
              </div>
            </Transition>
          </div>

          <!-- Список редактируемых компонентов -->
          <div class="flex flex-col gap-8" style="max-height: 220px; overflow-y: auto">
            <div
              v-for="(comp, idx) in draftComponents"
              :key="comp.idChildName"
              class="flex items-center gap-12 bg-surface border-dark rounded-8"
              style="padding: 12px 16px"
            >
              <div
                class="shrink-0 bg-secondary border-dark rounded-6 overflow-hidden flex items-center justify-center"
                style="width: 48px; height: 48px; padding: 4px"
              >
                <img
                  v-if="getComponentThumb(comp.idChildName)"
                  :src="getComponentThumb(comp.idChildName)!"
                  style="object-fit: contain; width: 100%; height: 100%"
                />
                <span class="text-xs" v-else>📦</span>
              </div>
              <div class="flex flex-col flex-1 min-w-0 gap-4">
                <span class="text-sm font-bold text-primary truncate">{{
                  getComponentTitle(comp.idChildName)
                }}</span>
                <span class="text-xs text-muted font-mono">ID: {{ comp.idChildName }}</span>
              </div>
              <div class="flex items-center gap-8 shrink-0">
                <span class="text-muted text-xs uppercase font-semibold">Кол-во:</span>
                <input
                  type="number"
                  v-model.number="comp.qty"
                  min="1"
                  class="input custom-table-qty"
                />
              </div>
              <button
                class="btn btn-xs btn-danger-soft shrink-0"
                style="padding: 8px 12px"
                @click="removeComponent(idx)"
              >
                ✕
              </button>
            </div>
            <div
              v-if="!draftComponents.length"
              class="text-xs text-error text-center"
              style="padding: 16px 0"
            >
              Комплект пуст. Сохранение сбросит статус комплекта.
            </div>
          </div>

          <!-- Кнопки действий -->
          <div class="flex justify-end gap-12 border-t pt-16">
            <button
              v-if="details?.isKit"
              class="btn btn-xs btn-danger-soft mr-auto"
              :disabled="isSaving"
              @click="destroyKit"
            >
              Расформировать
            </button>
            <button
              class="btn btn-xs btn-secondary"
              :disabled="isSaving"
              @click="toggleEdit(false)"
            >
              Отмена
            </button>
            <button class="btn btn-xs btn-primary" :disabled="isSaving" @click="submitKit">
              Сохранить
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  cardsService,
  type CardDetailItem,
  type CardItem,
  type KitComponentInputDto,
} from '@/api/cardsService'
import { useToast } from '@/composables/useToast'

const props = defineProps<{ idName: number; allCards: CardItem[] }>()
const emit = defineEmits(['updated', 'close'])
const toast = useToast()

const loading = ref(true)
const isSaving = ref(false)
const isEditing = ref(false)
const details = ref<CardDetailItem | null>(null)
const draftComponents = ref<KitComponentInputDto[]>([])

const searchQuery = ref('')
const isDropdownOpen = ref(false)
const autocompleteWrapperRef = ref<HTMLElement | null>(null)

// Флаг переключения интерфейса на режим подтверждения удаления карточки
const isConfirmDeleteOpen = ref(false)

const filteredCards = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()
  const baseList = props.allCards.filter((c) => c.idName !== props.idName)

  if (!query) return baseList.slice(0, 10)

  return baseList
    .filter((card) => {
      const art = (card.cArt || '').toLowerCase()
      const name = (card.cName || '').toLowerCase()
      const id = String(card.idName)
      return art.includes(query) || name.includes(query) || id.includes(query)
    })
    .slice(0, 15)
})

const loadData = async () => {
  loading.value = true
  try {
    details.value = await cardsService.getCardById(props.idName)
    syncDraft()
  } catch {
    toast.error?.('Ошибка получения информации о товаре')
  } finally {
    loading.value = false
  }
}

const syncDraft = () => {
  draftComponents.value =
    details.value?.components?.map((c) => ({ idChildName: c.idName, qty: c.qty })) || []
}

const toggleEdit = (state: boolean) => {
  isEditing.value = state
  if (!state) syncDraft()
}

const addComponent = (card: CardItem) => {
  const target = draftComponents.value.find((c) => c.idChildName === card.idName)
  if (target) {
    target.qty++
  } else {
    draftComponents.value.push({ idChildName: card.idName, qty: 1 })
  }
  searchQuery.value = ''
  isDropdownOpen.value = false
}

const removeComponent = (index: number) => draftComponents.value.splice(index, 1)

const getComponentTitle = (idChildName: number): string => {
  const found = props.allCards.find((c) => c.idName === idChildName)
  return found
    ? `[${found.cArt || '—'}] ${found.cName || 'Без названия'}`
    : `Товар ID: ${idChildName}`
}

const getComponentThumb = (idChildName: number): string | null => {
  const found = props.allCards.find((c) => c.idName === idChildName)
  return found?.primaryImageURL || null
}

const submitKit = async () => {
  isSaving.value = true
  try {
    await cardsService.saveKit({ idParentName: props.idName, components: draftComponents.value })
    toast.success?.('Состав комплекта успешно зафиксирован!')
    toggleEdit(false)
    await loadData()
    emit('updated')
  } catch {
    toast.error?.('Не удалось сохранить изменения')
  } finally {
    isSaving.value = false
  }
}

const destroyKit = async () => {
  isSaving.value = true
  try {
    await cardsService.deleteKit(props.idName)
    toast.success?.('Комплект успешно расформирован!')
    toggleEdit(false)
    await loadData()
    emit('updated')
  } catch {
    toast.error?.('Ошибка расформирования')
  } finally {
    isSaving.value = false
  }
}

// Прямой вызов без вложенных диалогов
const executeCardDelete = async () => {
  if (!details.value) return

  isSaving.value = true
  try {
    const res = await cardsService.deleteCard(props.idName)
    if (res.success) {
      toast.success?.(res.message || 'Карточка товара успешно удалена!')
      isConfirmDeleteOpen.value = false
      emit('updated')
      emit('close')
    }
  } catch (error: unknown) {
    const errObj = error as Record<string, Record<string, Record<string, string>>>
    const serverMessage = errObj?.response?.data?.message || 'Не удалось удалить карточку товара.'
    toast.error?.(serverMessage)
  } finally {
    isSaving.value = false
  }
}

const handleClickOutside = (event: MouseEvent) => {
  if (
    autocompleteWrapperRef.value &&
    !autocompleteWrapperRef.value.contains(event.target as Node)
  ) {
    isDropdownOpen.value = false
  }
}

onMounted(() => {
  loadData()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.autocomplete-wrapper {
  position: relative;
  width: 100%;
}
.autocomplete-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--color-surface);
  border: 1px solid var(--color-border-dark);
  border-radius: var(--radius-8);
  max-height: 200px;
  overflow-y: auto;
  z-index: 50;
  box-shadow: var(--shadow-lg);
  margin-top: 4px;
}
.autocomplete-item {
  padding: 10px 16px;
  cursor: pointer;
  display: flex;
  gap: 12px;
  font-size: 13px;
  align-items: center;
  transition: background var(--transition-fast);
  color: var(--color-text-primary);
}
.autocomplete-item:hover {
  background: var(--color-background-secondary);
}
</style>
