<template>
  <v-app-bar flat border>

    <div  @click="router.push('/')" style="cursor: pointer;" class="d-flex align-center">
      <v-avatar v-if="app_conf.icon && app_conf.icon.startsWith('/')" class="mx-3" size="36" rounded="0">
        <v-img :src="app_conf.icon"></v-img>
      </v-avatar>
      <v-app-bar-nav-icon v-else :icon="app_conf.icon"></v-app-bar-nav-icon>
      <v-app-bar-title>
        <b>{{ app_conf.name }}</b>
      </v-app-bar-title>
    </div>

    <div v-if="currentPage" class="d-flex align-center">
      <span class="text-black font-weight-bold mx-2">&gt;</span>
      <span class="text-primary font-weight-bold">{{ $t('pages.' + currentPage) }}</span>
    </div>

    <v-spacer />
    <span v-if="hasPerm('ui:admin') && user" class="font-weight-bold" style="color: red;">
      {{ userState?.as_user || user.user }}
    </span>
    <v-spacer />

    <!-- Theme Toggle -->
    <v-btn v-if="loggedIn &&header_conf.theme_show" icon @click="toggleTheme">
      <v-icon>{{ theme.global.current.value.dark ? 'mdi-weather-sunny' : 'mdi-weather-night' }}</v-icon>
    </v-btn>

    <!-- Language Selector -->
    <v-menu v-if="header_conf.locales_show">
      <template v-slot:activator="{ props }">
        <v-btn icon v-bind="props">
          <v-icon>mdi-translate</v-icon>
        </v-btn>
      </template>
      <v-list>
        <v-list-item v-for="l in locales" :key="l.code" @click="setLocale(l.code)">
          <v-list-item-title>{{ l.name }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>

    <!-- User Events Bell -->
    <UserEvents v-if="loggedIn" />

    <!-- Logged in controls -->
    <div v-if="loggedIn" class="d-flex align-center">

      <div v-for="page in header_conf.pages" :key="page.name">
        <template v-if="page.children && page.children.length > 0">
          <v-speed-dial location="bottom center" transition="scale-transition">
            <template v-slot:activator="{ props: activatorProps }">
              <v-btn icon v-bind="activatorProps">
                <v-icon v-tooltip="page.name">{{ page.icon }}</v-icon>
              </v-btn>
            </template>
            <template v-for="child in page.children" :key="child.path">
              <v-btn
                v-if="!child.permissions || hasPerm(child.permissions)"
                icon
                @click="router.push(child.path)"
              >
                <v-icon v-tooltip="child.name">{{ child.icon }}</v-icon>
              </v-btn>
            </template>
          </v-speed-dial>
        </template>
        <template v-else>
          <v-btn v-if="!page.permissions || hasPerm(page.permissions)" icon @click="router.push(page.path)">
            <v-icon v-tooltip="$t('pages.' + page.name)" >{{ page.icon }}</v-icon>
          </v-btn>
        </template>
      </div>

      <v-menu>
        <template v-slot:activator="{ props: activatorProps }">
          <v-btn icon v-bind="activatorProps">
            <v-icon>mdi-account</v-icon>
          </v-btn>
        </template>
        <v-card min-width="200">
          <v-list>
            <v-list-item>
              <v-list-item-title>{{ user?.user }} 
                <v-icon color="primary" size="small" @click="handleLogout" class="ml-1 float-right">mdi-logout</v-icon>
                <v-icon color="primary" size="small" @click="router.push('/preferences')" class="ml-3 float-right">mdi-cog</v-icon>
              </v-list-item-title>
            </v-list-item>
            <account_menu />
          </v-list>
        </v-card>
      </v-menu>
    </div>
  </v-app-bar>
</template>

<script setup lang="ts">
import app_conf from '~/metadata/app.json'
import header_conf from '~/metadata/header.json'
import { apiPost } from '~/util/fetch/wrappers'
import type { UserState } from '~/types/user_state'
import hasPerm from '~/util/hasPerm'
import { computed } from 'vue'

const userState = useState<UserState>('user')
const route = useRoute()
const currentPage = computed(() => {
  for (const page of header_conf.pages) {
    if (page.path === route.path) return page.name;
    if (page.children) {
      const child = page.children.find(c => c.path === route.path);
      if (child) return child.name;
    }
  }
  return '';
})

const theme = useTheme()
const toggleTheme = () => {
  const setTheme = theme.global.current.value.dark ? 'light' : 'dark'
  theme.global.name.value = setTheme
}

const { setLocale, locales } = useI18n()
const { loggedIn, user, clear} = useUserSession()
const router = useRouter()

const handleLogout = async () => {
  try {
    await apiPost('/api/auth/logout', {})
  } catch (err) {
    // API failure handled by global notifier
  }
  await clear()
  router.push('/landing')
}

</script>
