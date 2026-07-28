import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import ProfileView from '../views/Profile/ProfileView.vue'
import StockDocumentsView from '../views/Invoice/InvoiceView.vue'
import RemainsList from '../views/RemainsList.vue'
import CardsView from '../views/CardsView.vue'
import JurpersonSelectView from '../views/JurpersonSelectView.vue'
import MarketplaceLinks from '../views/MarketplaceLinks.vue' // <-- НОВЫЙ ИМПОРТ НАШЕЙ СТРАНИЦЫ ИНТЕГРАЦИЙ
import { adminService, type UserPermissionsResponse } from '../api/adminService'
import TariffView from '../views/TariffView.vue' // <-- Импорт

const routes = [
  {
    path: '/',
    redirect: '/documents',
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
  },
  {
    path: '/profile',
    name: 'Profile',
    component: ProfileView,
    meta: { requiresAuth: true, requiresJurperson: true, requiredPermission: 'profile' },
  },
  {
    path: '/documents',
    name: 'StockDocuments',
    component: StockDocumentsView,
    meta: { requiresAuth: true, requiresJurperson: true },
  },
  {
    path: '/tariff',
    name: 'Tariff',
    component: TariffView,
  },
  {
    path: '/remains',
    name: 'RemainsList',
    component: RemainsList,
    meta: { requiresAuth: true, requiresJurperson: true, requiredPermission: 'remains' },
  },
  {
    path: '/cards',
    name: 'CardsList',
    component: CardsView,
    meta: { requiresAuth: true, requiresJurperson: true, requiredPermission: 'cards' },
  },
  {
    // <-- НОВЫЙ РОУТ ДЛЯ МАРКЕТПЛЕЙСОВ
    path: '/marketplace-links',
    name: 'MarketplaceLinks',
    component: MarketplaceLinks,
    meta: { requiresAuth: true, requiresJurperson: true, requiredPermission: 'cards' },
  },
  {
    path: '/select-jurperson',
    name: 'SelectJurperson',
    component: JurpersonSelectView,
    meta: { requiresAuth: true },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(_to, _from, _savedPosition) {
    return { top: 0, behavior: 'instant' }
  },
})

router.beforeEach(async (to, _from) => {
  const isAuthenticated = !!localStorage.getItem('access_token')

  const getJurpersonIdFromToken = () => {
    const token = localStorage.getItem('access_token')
    if (!token) return null
    try {
      const parts = token.split('.')
      if (parts.length < 2) return null
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
      return payload.jid ?? null
    } catch {
      return null
    }
  }

  const hasJurperson = !!getJurpersonIdFromToken()

  // 1. Не авторизован — марш на логин
  if (to.meta.requiresAuth && !isAuthenticated) {
    return '/login'
  }

  // 2. Авторизован и лезет на логин — отправляем в документы
  if (to.path === '/login' && isAuthenticated) {
    return '/documents'
  }

  // 3. Нет выбранной организации — отправляем выбирать
  if (to.meta.requiresJurperson && isAuthenticated && !hasJurperson) {
    return '/select-jurperson'
  }

  // 4. Проверка прав через наш новый синглтон adminService
  if (isAuthenticated && hasJurperson) {
    // Если реактивное состояние еще не загружено, запрашиваем API
    if (!adminService.isLoaded.value) {
      await adminService.getPermissions().catch(() => {
        // Ошибка сети или авторизации — сбрасываем состояние
        adminService.resetPermissions()
      })
    }

    const requiredPermission = to.meta.requiredPermission as
      | keyof UserPermissionsResponse
      | undefined

    // Проверяем флаг через .value из computed свойства сервиса
    if (requiredPermission && !adminService.permissions.value[requiredPermission]) {
      return '/documents'
    }
  }

  return true // Переход разрешен
})

export default router
