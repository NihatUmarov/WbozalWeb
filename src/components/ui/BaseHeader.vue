<template>
  <header class="main-header">
    <div class="main-header__inner">
      <div class="main-header__left">
        <div class="main-header__logo" @click="router.push('/')">WBOZAL.RU</div>
        <nav class="header-dock">
          <router-link v-for="i in visibleMenuItems" :key="i.label" :to="i.to" class="dock-item" active-class="active">
            <div class="dock-button"><span class="dock-label">{{ i.label }}</span></div>
          </router-link>
        </nav>
      </div>

      <div class="main-header__right">
        <div class="brand-dropdown" ref="dropdownRef">
          <div class="dropdown-trigger" :class="{ 'not-selected': !selectedId, 'is-open': isDropdownOpen }" @click="isDropdownOpen = !isDropdownOpen">
            <Building2 class="dropdown-icon" />
            <span class="trigger-text">{{ currentJurperson?.jurpersonName || 'Выберите организацию' }}</span>
            <ChevronDown class="arrow-icon" :class="{ rotate: isDropdownOpen }" />
          </div>

          <Transition name="dropdown-fade">
            <div v-if="isDropdownOpen" class="floating-dropdown-menu" @click.stop>
              <div class="search-wrapper"><input v-model="searchQuery" type="text" placeholder="Поиск..." class="input search-input" /></div>
              <div class="dropdown-list">
                <div v-for="j in filteredJurpersons" :key="j.idJurperson" :class="['dropdown-item', { active: j.idJurperson === selectedId }]" @click="handleJurpersonSelect(j.idJurperson)">
                  <div class="brand-info-block"><span class="brand-name">{{ j.jurpersonName }}</span><span class="brand-id">ID: {{ j.idJurperson }}</span></div>
                  <Check v-if="j.idJurperson === selectedId" class="check-mark-icon" />
                </div>
                <div v-if="!filteredJurpersons.length" class="no-results">Ничего не найдено</div>
              </div>
              <div class="dropdown-footer"><button class="add-org-btn" @click="goToCreatePage">Мои организации</button></div>
            </div>
          </Transition>
        </div>

        <button class="logout-btn" @click="handleLogout" title="Выйти"><span class="logout-text">Выход</span><LogOut class="logout-icon" /></button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Building2, ChevronDown, Check, LogOut } from 'lucide-vue-next'
import { useJurpersons } from '@/composables/useJurpersons'
import { adminService, type UserPermissionsResponse } from '@/api/adminService'

const router = useRouter(), dropdownRef = ref<HTMLElement | null>(null), searchQuery = ref(''), isDropdownOpen = ref(false)
const menuItems = [
  { label: 'Остатки', to: '/remains', p: 'remains' as keyof UserPermissionsResponse },
  { label: 'Накладные', to: '/documents', p: 'invoice' as keyof UserPermissionsResponse },
  { label: 'Карточки', to: '/cards', p: 'cards' as keyof UserPermissionsResponse },
  { label: 'Интеграции', to: '/marketplace-links', p: 'cards' as keyof UserPermissionsResponse },
  { label: 'Профиль', to: '/profile', p: 'profile' as keyof UserPermissionsResponse }
]

const visibleMenuItems = computed(() => menuItems.filter(i => adminService.permissions.value[i.p]))
const { jurpersons, selectedId, currentJurperson, load, select } = useJurpersons()

const filteredJurpersons = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return q ? jurpersons.value.filter(j => j.jurpersonName?.toLowerCase().includes(q) || j.idJurperson?.toString().includes(q)) : jurpersons.value
})

const handleJurpersonSelect = async (id: number) => { if (id !== selectedId.value && await select(id)) window.location.reload() }
const handleClickOutside = (e: MouseEvent) => { if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) isDropdownOpen.value = false }
const goToCreatePage = () => { isDropdownOpen.value = false; router.push('/select-jurperson') }
const handleLogout = () => { localStorage.clear(); window.location.href = '/login' }

onMounted(() => { document.addEventListener('click', handleClickOutside); load() })
onUnmounted(() => document.removeEventListener('click', handleClickOutside))
</script>
