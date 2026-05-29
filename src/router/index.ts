import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import ProfileView from '../views/ProfileView.vue'
import StockDocumentsView from '../views/StockDocumentsView.vue'
import RemainsList from '../views/RemainsList.vue'
import CardsView from '../views/CardsView.vue'
import JurpersonSelectView from '../views/JurpersonSelectView.vue'

const routes = [
  {
    path: '/',
    redirect: '/profile',
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
    meta: { requiresAuth: true, requiresJurperson: true },
  },
  {
    path: '/documents',
    name: 'StockDocuments',
    component: StockDocumentsView,
    meta: { requiresAuth: true, requiresJurperson: true },
  },
  {
    path: '/remains',
    name: 'RemainsList',
    component: RemainsList,
    meta: { requiresAuth: true, requiresJurperson: true },
  },
  {
    path: '/cards',
    name: 'CardsList',
    component: CardsView,
    meta: { requiresAuth: true, requiresJurperson: true },
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
  scrollBehavior(to, from, savedPosition) {
    // Всегда прокручивать к началу страницы
    return { top: 0, behavior: 'instant' }
  },
})

router.beforeEach((to, from, next) => {
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
    next('/profile')
    return
  }

  if (to.meta.requiresJurperson && isAuthenticated && !hasJurperson) {
    next('/select-jurperson')
    return
  }

  next()
})

export default router
