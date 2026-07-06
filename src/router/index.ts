import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import ProfileView from '../views/Profile/ProfileView.vue'
import StockDocumentsView from '../views/Invoice/InvoiceView.vue'
import RemainsList from '../views/RemainsList.vue'
import CardsView from '../views/CardsView.vue'
import JurpersonSelectView from '../views/JurpersonSelectView.vue'
import { usePermissions } from '../services/permissionsStore' // Импортируем наше хранилище прав

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
    meta: { requiresAuth: true, requiresJurperson: true, requiredPermission: 'profile' }, // Проверяем флаг profile
  },
  {
    path: '/documents',
    name: 'StockDocuments',
    component: StockDocumentsView,
    meta: { requiresAuth: true, requiresJurperson: true }, // Сюда пускаем всех, у кого есть организация
  },
  {
    path: '/remains',
    name: 'RemainsList',
    component: RemainsList,
    meta: { requiresAuth: true, requiresJurperson: true, requiredPermission: 'remains' }, // Проверяем флаг remains
  },
  {
    path: '/cards',
    name: 'CardsList',
    component: CardsView,
    meta: { requiresAuth: true, requiresJurperson: true, requiredPermission: 'cards' }, // Проверяем флаг cards
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

router.beforeEach(async (to, from, next) => {
  // Добавили async
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

  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login')
    return
  }

  if (to.path === '/login' && isAuthenticated) {
    next('/documents')
    return
  }

  if (to.meta.requiresJurperson && isAuthenticated && !hasJurperson) {
    next('/select-jurperson')
    return
  }

  if (isAuthenticated && hasJurperson) {
    const { permissions, isLoaded, fetchPermissions } = usePermissions()
    if (!isLoaded.value) {
      await fetchPermissions()
    }
    const requiredPermission = to.meta.requiredPermission as
      | keyof typeof permissions.value
      | undefined
    if (requiredPermission && !permissions.value[requiredPermission]) {
      next('/documents')
      return
    }
  }

  next()
})

export default router
