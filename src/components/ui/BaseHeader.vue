<!-- BaseHeader.vue -->
<template>
  <header class="main-header glass-effect">
    <div class="main-header__left">
      <div class="main-header__logo" @click="router.push('/')">WBOZAL.RU</div>

      <nav class="header-dock">
        <router-link
          v-for="item in visibleMenuItems"
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

        <Transition name="dropdown-fade">
          <div v-if="isDropdownOpen" class="floating-dropdown-menu" @click.stop>
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
      </div>

      <button class="logout-btn" @click="handleLogoutAction" title="Выйти">
        <span class="logout-text">Выход</span>
        <LogOut class="logout-icon" />
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
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
import { adminService } from '@/api/adminService' // Импорт остается

const router = useRouter()
const dropdownRef = ref<HTMLElement | null>(null)
const searchQuery = ref('')
const isDropdownOpen = ref(false)

const permissions = adminService.permissions

const menuItems = [
  { label: 'Остатки', icon: Package, to: '/remains', permission: 'remains' as const },
  { label: 'Накладные', icon: FileText, to: '/documents', permission: 'invoice' as const },
  { label: 'Карточки', icon: CreditCard, to: '/cards', permission: 'cards' as const },
  { label: 'Интеграции', icon: Building2, to: '/marketplace-links', permission: 'cards' as const },
  { label: 'Профиль', icon: User, to: '/profile', permission: 'profile' as const },
]

const visibleMenuItems = computed(() =>
  menuItems.filter((item) => permissions.value[item.permission] === true),
)

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

const toggleDropdown = () => (isDropdownOpen.value = !isDropdownOpen.value)

const handleJurpersonSelect = async (idJurperson: number) => {
  if (idJurperson === selectedId.value) return
  if (await select(idJurperson)) {
    isDropdownOpen.value = false
    window.location.reload()
  }
}

const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
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
  load()
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
