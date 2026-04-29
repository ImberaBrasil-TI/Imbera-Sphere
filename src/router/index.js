import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { public: true }
  },
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/etiquetas',
    name: 'etiquetas',
    component: () => import('../views/EtiquetasView.vue')
  },
  {
    path: '/tokens',
    name: 'tokens',
    component: () => import('../views/TokensView.vue')
  },
  {
    path: '/chat',
    name: 'chat',
    component: () => import('../views/ChatView.vue')
  },
  {
    path: '/gastos',
    name: 'gastos',
    component: () => import('../views/GastosView.vue')
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('../views/SettingsView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// Navigation Guard
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // Verifica se o usuário já está carregado ou tenta buscar a sessão
  const user = authStore.user || await authStore.fetchUser()

  if (!to.meta.public && !user) {
    // Se a rota não for pública e o usuário não estiver logado, vai para login
    next('/login')
  } else if (to.name === 'login' && user) {
    // Se já estiver logado e tentar ir para login, vai para home
    next('/')
  } else {
    next()
  }
})

export default router
