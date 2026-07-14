export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn } = useUserSession()

  const publicRoutes = ['/landing', '/login', '/register', '/howto']

  if (!publicRoutes.includes(to.path)) {
    if (!loggedIn.value) {
      return navigateTo('/login')
    }
  }
})
