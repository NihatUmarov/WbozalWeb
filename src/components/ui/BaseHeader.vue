<template>
  <header class="base-header glass-effect">
    <div class="base-header__left">
      <div class="base-header__logo" @click="router.push('/')">WBOZAL.RU</div>
      <TheDock class="base-header__dock" />
    </div>

    <div class="base-header__right">
      <div class="brand-dropdown" ref="dropdownRef">
        <div
          class="dropdown-trigger"
          :class="{ 'not-selected': !selectedJurpersonId, 'is-open': isDropdownOpen }"
          @click="toggleDropdown"
        >
          <span class="folder-icon">💼</span>
          <span class="trigger-text">{{ currentJurpersonName }}</span>
          <span class="arrow-icon" :class="{ rotate: isDropdownOpen }">▾</span>
        </div>

        <div class="dropdown-menu" :class="{ 'is-visible': isDropdownOpen }">
          <div class="search-wrapper">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Поиск организации..."
              class="dropdown-search"
              @click.stop
            />
          </div>

          <div class="dropdown-list">
            <div
              v-for="jurperson in filteredJurpersons"
              :key="jurperson.idJurperson"
              :class="['dropdown-item', { active: jurperson.idJurperson === selectedJurpersonId }]"
              @click="handleJurpersonSelect(jurperson.idJurperson)"
            >
              <div class="brand-info-block">
                <span class="brand-name">{{ jurperson.jurpersonName }}</span>
                <span class="brand-id">ID: {{ jurperson.idJurperson }}</span>
              </div>
              <span v-if="jurperson.idJurperson === selectedJurpersonId" class="check-mark">✓</span>
            </div>

            <div v-if="filteredJurpersons.length === 0" class="no-results">Ничего не найдено</div>
          </div>

          <div class="dropdown-footer">
            <button class="add-org-btn" @click="goToCreatePage">
              <span>➕ Добавить организацию</span>
            </button>
          </div>
        </div>
      </div>

      <div class="user-menu">
        <button class="logout-btn" @click="handleLogoutAction" title="Выйти из аккаунта">
          <span class="logout-text">Выход</span>
          <span class="logout-icon">🚪</span>
        </button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { jurpersonService } from '@/api/jurpersonService'
import { authService } from '@/api/authService'

import type { JurpersonShort, GetJurpersonsResponse } from '@/api/types'
import TheDock from '@/components/ui/MacDock.vue'

const router = useRouter()

const dropdownRef = ref<HTMLElement | null>(null)

const jurpersons = ref<JurpersonShort[]>([])
const selectedJurpersonId = ref<number | null>(null)
const searchQuery = ref('')
const isDropdownOpen = ref(false)

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value
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

const currentJurpersonName = computed(() => {
  const active = jurpersons.value.find((j) => j.idJurperson === selectedJurpersonId.value)
  return active ? active.jurpersonName : 'Выберите организацию'
})

const filteredJurpersons = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return jurpersons.value

  return jurpersons.value.filter((j) => {
    const name = j.jurpersonName ? j.jurpersonName.toLowerCase() : ''
    const id = j.idJurperson ? j.idJurperson.toString() : ''
    return name.includes(query) || id.includes(query)
  })
})

onMounted(async () => {
  document.addEventListener('click', handleClickOutside)
  try {
    const data: GetJurpersonsResponse = await jurpersonService.getJurpersons()
    jurpersons.value = data.jurpersons

    if (data.activeId) {
      selectedJurpersonId.value = data.activeId
      localStorage.setItem('selected_jurperson_id', data.activeId.toString())
    } else {
      selectedJurpersonId.value = null
      localStorage.removeItem('selected_jurperson_id')
      // No toast here, as MainLayout is the top-level layout.
      // Any toast should be handled by the pages themselves or globally if needed.
    }
  } catch (err) {
    console.error(err)
    // No toast here for the same reason as above.
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

const handleJurpersonSelect = async (idJurperson: number) => {
  if (idJurperson === selectedJurpersonId.value) return
  try {
    await authService.switchProfile(idJurperson)

    localStorage.setItem('selected_jurperson_id', idJurperson.toString())
    selectedJurpersonId.value = idJurperson
    isDropdownOpen.value = false

    // No toast here for the same reason as above.

    setTimeout(() => {
      window.location.reload()
    }, 1000)
  } catch (error) {
    console.error(error)
    // No toast here for the same reason as above.
  }
}

const handleLogoutAction = () => {
  localStorage.clear()
  window.location.href = '/login'
}
</script>

<style scoped>
.base-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  padding: 0 var(--spacing-24);
  height: 70px;
  box-sizing: border-box;
  border-bottom: 1px solid var(--color-border);
  z-index: var(--z-sticky);
  background: var(--glass-background);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
}

.base-header__left {
  display: flex;
  align-items: center;
  gap: var(--spacing-24);
  flex: 1;
}

.base-header__logo {
  font-weight: var(--font-weight-extrabold);
  color: var(--color-text-primary);
  font-size: var(--font-size-2xl);
  letter-spacing: var(--letter-spacing-tight);
  cursor: pointer;
  white-space: nowrap;
}

.base-header__dock {
  flex: 0 0 auto;
}

.base-header__right {
  display: flex;
  align-items: center;
  gap: var(--spacing-20);
  flex: 1;
  justify-content: flex-end;
}

.brand-dropdown {
  position: relative;
  user-select: none;
}

.dropdown-footer {
  border-top: 1px solid var(--color-border-light);
  padding: var(--spacing-8);
  background: var(--color-background-secondary);
}

.add-org-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-6);
  padding: var(--spacing-8) var(--spacing-12);
  background: var(--color-surface);
  border: 1px dashed var(--color-border-dark);
  border-radius: var(--border-radius-8);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary-dark);
  cursor: pointer;
  transition: all var(--transition-base);
  box-shadow: var(--shadow-xs);
}

.add-org-btn:hover {
  background: var(--color-primary-subtle);
  border-color: var(--color-primary-muted);
  color: var(--color-primary);
  box-shadow: var(--shadow-sm);
}

.add-org-btn:active {
  transform: scale(0.98);
  box-shadow: var(--shadow-xs);
}

.dropdown-trigger {
  display: flex;
  align-items: center;
  gap: var(--spacing-8);
  padding: var(--spacing-8) var(--spacing-12);
  background: var(--color-background-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-10);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-base);
}

.trigger-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
}

.dropdown-trigger:hover,
.dropdown-trigger.is-open {
  background: var(--color-background-secondary);
  color: var(--color-text-primary);
  border-color: var(--color-border-dark);
}

.dropdown-trigger.not-selected {
  background: var(--color-error-subtle);
  border-color: var(--color-error-muted);
  color: var(--color-error-text);
  animation: pulse 2s infinite;
}

.arrow-icon {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
  transition: transform var(--transition-fast);
}

.arrow-icon.rotate {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: var(--spacing-8);
  width: 280px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-12);
  box-shadow: var(--shadow-lg);
  opacity: 0;
  visibility: hidden;
  transform: translateY(-8px);
  transition: all var(--transition-base);
  overflow: hidden;
}

.dropdown-menu.is-visible {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.search-wrapper {
  padding: var(--spacing-10);
  border-bottom: 1px solid var(--color-border-light);
  background: var(--color-background-secondary);
}

.dropdown-search {
  width: 100%;
  padding: var(--spacing-8) var(--spacing-12);
  border: 1px solid var(--color-border-dark);
  border-radius: var(--border-radius-8);
  font-size: var(--font-size-base);
  box-sizing: border-box;
  outline: none;
  background: var(--color-surface);
  color: var(--color-text-primary);
}

.dropdown-search:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-subtle);
}

.dropdown-list {
  max-height: 240px;
  overflow-y: auto;
}

.dropdown-item {
  padding: var(--spacing-10) var(--spacing-14);
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  border-left: 3px solid transparent;
  transition: all var(--transition-fast);
}

.dropdown-item:hover {
  background: var(--color-background-secondary);
}

.dropdown-item.active {
  background: var(--color-primary-subtle);
  border-left-color: var(--color-primary);
}

.brand-info-block {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.brand-name {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.dropdown-item.active .brand-name {
  color: var(--color-primary);
  font-weight: var(--font-weight-semibold);
}

.brand-id {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  background: var(--color-background-secondary);
  padding: var(--spacing-1) var(--spacing-4);
  border-radius: var(--border-radius-4);
  width: fit-content;
}

.dropdown-item.active .brand-id {
  background: var(--color-primary-subtle);
  color: var(--color-primary);
}

.check-mark {
  color: var(--color-primary);
  font-weight: var(--font-weight-bold);
}

.no-results {
  padding: var(--spacing-20) var(--spacing-14);
  text-align: center;
  color: var(--color-text-tertiary);
  font-size: var(--font-size-base);
}

.logout-btn {
  background: none;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-base);
  transition: all var(--transition-fast);
  padding: var(--spacing-8) var(--spacing-12);
  border-radius: var(--border-radius-8);
  display: flex;
  align-items: center;
  gap: var(--spacing-6);
}

.logout-btn:hover {
  color: var(--color-error-text);
  background: var(--color-error-subtle);
}

.logout-icon {
  display: none;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

/* Media Queries */
@media (max-width: 1050px) {
  .base-header {
    padding: 0 var(--spacing-16);
    gap: var(--spacing-12);
  }

  .base-header__logo {
    display: none;
  }

  .base-header__left {
    flex: 1;
    justify-content: flex-start;
  }
}

@media (max-width: 650px) {
  .base-header {
    padding: 0 var(--spacing-10);
    gap: var(--spacing-8);
  }

  .base-header__right {
    gap: var(--spacing-8);
  }

  .trigger-text {
    max-width: 75px;
  }

  .logout-text {
    display: none;
  }

  .logout-icon {
    display: block;
    font-size: var(--font-size-lg);
  }

  .logout-btn {
    padding: var(--spacing-6);
  }
}
</style>
