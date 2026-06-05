<template>
  <header class="main-header glass-effect">
    <div class="main-header__left">
      <div class="main-header__logo" @click="router.push('/')">WBOZAL.RU</div>

      <nav class="header-dock">
        <router-link
          v-for="item in menuItems"
          :key="item.label"
          :to="item.to"
          class="dock-item"
          active-class="active"
        >
          <div class="dock-button">
            <component :is="item.icon" class="dock-icon mobile-only" />
            <span class="dock-label">{{ item.label }}</span>
          </div>
        </router-link>
      </nav>
    </div>

    <div class="main-header__right">
      <div class="brand-dropdown" ref="dropdownRef">
        <div
          class="dropdown-trigger"
          :class="{ 'not-selected': !selectedId, 'is-open': isDropdownOpen }"
          @click="toggleDropdown"
        >
          <Building2 class="dropdown-icon" />
          <span class="trigger-text">{{ currentJurpersonName }}</span>
          <ChevronDown class="arrow-icon" :class="{ rotate: isDropdownOpen }" />
        </div>
      </div>

      <button class="logout-btn" @click="handleLogoutAction" title="Выйти">
        <span class="logout-text">Выход</span>
        <LogOut class="logout-icon" />
      </button>
    </div>
  </header>

  <Teleport to="body">
    <Transition name="dropdown-fade">
      <div v-if="isDropdownOpen" class="floating-dropdown-menu" :style="dropdownStyle" @click.stop>
        <div class="search-wrapper">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Поиск организации..."
            class="input search-input"
          />
        </div>

        <div class="dropdown-list">
          <div
            v-for="jurperson in filteredJurpersons"
            :key="jurperson.idJurperson"
            :class="['dropdown-item', { active: jurperson.idJurperson === selectedId }]"
            @click="handleJurpersonSelect(jurperson.idJurperson)"
          >
            <div class="brand-info-block">
              <span class="brand-name">{{ jurperson.jurpersonName }}</span>
              <span class="brand-id">ID: {{ jurperson.idJurperson }}</span>
            </div>
            <Check v-if="jurperson.idJurperson === selectedId" class="check-mark-icon" />
          </div>
          <div v-if="filteredJurpersons.length === 0" class="no-results">Ничего не найдено</div>
        </div>

        <div class="dropdown-footer">
          <button class="add-org-btn" @click="goToCreatePage">Мои организации</button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import {
  Building2,
  ChevronDown,
  Check,
  LogOut,
  Package,
  FileText,
  CreditCard,
  User,
} from 'lucide-vue-next'
import { useJurpersons } from '@/composables/useJurpersons'

const router = useRouter()
const dropdownRef = ref<HTMLElement | null>(null)
const searchQuery = ref('')
const isDropdownOpen = ref(false)

// Координаты для позиционирования телепортированного меню
const dropdownStyle = ref({ top: '0px', left: '0px', width: '280px' })

const menuItems = [
  { label: 'Остатки', icon: Package, to: '/remains' },
  { label: 'Накладные', icon: FileText, to: '/documents' },
  { label: 'Карточки', icon: CreditCard, to: '/cards' },
  { label: 'Профиль', icon: User, to: '/profile' },
]

const { jurpersons, selectedId, currentJurperson, load, select } = useJurpersons(undefined)

const currentJurpersonName = computed(
  () => currentJurperson.value?.jurpersonName || 'Выберите организацию',
)

const filteredJurpersons = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return jurpersons.value
  return jurpersons.value.filter((j) => {
    const name = j.jurpersonName?.toLowerCase() || ''
    const id = j.idJurperson?.toString() || ''
    return name.includes(query) || id.includes(query)
  })
})

// Динамический расчет положения дропдауна под кнопкой-триггером
const updateDropdownPosition = () => {
  if (!dropdownRef.value) return
  const rect = dropdownRef.value.getBoundingClientRect()

  dropdownStyle.value = {
    top: `${rect.bottom + window.scrollY + 6}px`,
    // Выравниваем по правому краю кнопки-триггера
    left: `${rect.right - 280}px`,
    width: '280px',
  }
}

const toggleDropdown = async () => {
  isDropdownOpen.value = !isDropdownOpen.value
  if (isDropdownOpen.value) {
    await nextTick()
    updateDropdownPosition()
  }
}

const handleJurpersonSelect = async (idJurperson: number) => {
  if (idJurperson === selectedId.value) return
  if (await select(idJurperson)) {
    isDropdownOpen.value = false
    setTimeout(() => window.location.reload(), 500)
  }
}

const handleClickOutside = (event: MouseEvent) => {
  // Закрываем, если кликнули вне кнопки триггера и вне самого плавающего меню
  const target = event.target as HTMLElement
  if (
    dropdownRef.value &&
    !dropdownRef.value.contains(target) &&
    !target.closest('.floating-dropdown-menu')
  ) {
    isDropdownOpen.value = false
  }
}

const goToCreatePage = () => {
  isDropdownOpen.value = false
  router.push('/select-jurperson')
}

const handleLogoutAction = () => {
  localStorage.clear()
  window.location.href = '/login'
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  window.addEventListener('resize', updateDropdownPosition)
  window.addEventListener('scroll', updateDropdownPosition)
  load()
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('resize', updateDropdownPosition)
  window.removeEventListener('scroll', updateDropdownPosition)
})
</script>

<style scoped>
.main-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--spacing-24);
  height: 64px;
  border-bottom: 1px solid var(--color-border);
  z-index: var(--z-sticky);
  background: var(--glass-background);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
}

.main-header__left,
.main-header__right {
  display: flex;
  align-items: center;
  gap: var(--spacing-20);
}

.main-header__logo {
  font-weight: 800;
  color: var(--color-text-primary);
  font-size: 16px;
  letter-spacing: -0.02em;
  cursor: pointer;
}

.header-dock {
  display: flex;
  gap: var(--spacing-4);
  padding: 4px;
  background: var(--color-background-secondary);
  border-radius: var(--radius-8);
  border: 1px solid var(--color-border);
}

.dock-button {
  display: flex;
  align-items: center;
  gap: var(--spacing-8);
  padding: 6px var(--spacing-12);
  border-radius: var(--radius-6);
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
  transition: all var(--transition-fast);
}

.dock-icon {
  width: 16px;
  height: 16px;
  stroke-width: 2;
}

/* Скрываем иконки на десктопе по умолчанию */
.mobile-only {
  display: none;
}

.dock-item:hover .dock-button {
  color: var(--color-text-primary);
  background: var(--color-border);
}
.dock-item.active .dock-button {
  color: var(--color-primary);
  background: var(--color-primary-subtle);
}

/* Выпадающий список */
.brand-dropdown {
  position: relative;
  user-select: none;
}
.dropdown-trigger {
  display: flex;
  align-items: center;
  gap: var(--spacing-8);
  padding: 6px var(--spacing-12);
  background: var(--color-background-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-8);
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}
.dropdown-trigger:hover {
  border-color: var(--color-text-secondary);
  color: var(--color-text-primary);
}
.dropdown-trigger.not-selected {
  background: var(--color-error-subtle);
  border-color: var(--color-error-text);
  color: var(--color-error-text);
}
.trigger-text {
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.arrow-icon {
  width: 14px;
  height: 14px;
  transition: transform var(--transition-fast);
}
.arrow-icon.rotate {
  transform: rotate(180deg);
}

/* ПЛАВАЮЩЕЕ МЕНЮ (Абсолютное позиционирование в body) */
.floating-dropdown-menu {
  position: absolute;
  background: var(--color-surface);
  border: 1px solid var(--color-border-dark);
  border-radius: var(--radius-10);
  box-shadow: var(--shadow-md);
  overflow: hidden;
  /* Ставим максимальный z-index, чтобы перебить любые таблицы */
  z-index: 99999;
}

.search-wrapper {
  padding: var(--spacing-8);
  background: var(--color-background-secondary);
  border-bottom: 1px solid var(--color-border);
}
.search-input {
  padding: var(--spacing-6) var(--spacing-12);
  font-size: 13px;
  border-radius: var(--radius-6);
}

.dropdown-list {
  max-height: 240px;
  overflow-y: auto;
  scrollbar-width: thin;
}
.dropdown-item {
  padding: var(--spacing-10) var(--spacing-12);
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  border-bottom: 1px solid var(--color-border);
  transition: background var(--transition-fast);
  color: var(--color-text-primary);
}
.dropdown-item:last-child {
  border-bottom: none;
}
.dropdown-item:hover {
  background: var(--color-background-secondary);
}
.dropdown-item.active {
  background: var(--color-primary-subtle);
  color: var(--color-primary);
}
.brand-info-block {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.brand-name {
  font-size: 13px;
  font-weight: 500;
  line-height: 1.3;
}
.brand-id {
  font-size: 10px;
  color: var(--color-text-tertiary);
}
.check-mark-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}
.no-results {
  padding: var(--spacing-16);
  text-align: center;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.dropdown-footer {
  padding: var(--spacing-8);
  border-top: 1px solid var(--color-border);
  background: var(--color-background-secondary);
}
.add-org-btn {
  width: 100%;
  background: var(--color-surface);
  border: 1px dashed var(--color-border-dark);
  padding: var(--spacing-8);
  border-radius: var(--radius-6);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  color: var(--color-text-secondary);
  transition: all var(--transition-fast);
}
.add-org-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-surface);
}

.logout-btn {
  background: none;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px;
  transition: color var(--transition-fast);
}
.logout-btn:hover {
  color: var(--color-error-text);
}
.logout-icon {
  width: 16px;
  height: 16px;
}

.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition:
    opacity var(--transition-fast),
    transform var(--transition-fast);
}
.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

@media (max-width: 768px) {
  .main-header__logo,
  .dock-label,
  .logout-text {
    display: none;
  }
  /* На мобилках возвращаем иконки в меню, чтобы интерфейс влезал в экран */
  .mobile-only {
    display: block;
  }
}
</style>
