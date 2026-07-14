<template>
  <v-app-bar flat border>
    <div @click="router.push('/')" style="cursor: pointer;" class="d-flex align-center">
      <v-app-bar-nav-icon :icon="header_conf.icon"></v-app-bar-nav-icon>
      <v-app-bar-title>
        {{ app_conf.name }}
      </v-app-bar-title>
    </div>

    <v-spacer></v-spacer>

    <!-- Theme Toggle -->
    <v-btn v-if="header_conf.theme_show" icon @click="toggleTheme">
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

    <!-- Logged in controls -->
    <div v-if="loggedIn" class="d-flex align-center">

      <v-btn v-for="page in header_conf.pages" :key="page.path" icon @click="router.push(page.path)">
        <v-icon>{{ page.icon }}</v-icon>
      </v-btn>

      <v-menu>
        <template v-slot:activator="{ props }">
          <v-btn icon v-bind="props">
            <v-icon>mdi-account</v-icon>
          </v-btn>
        </template>
        <v-card min-width="200">
          <v-list>
            <v-list-item>
              <v-list-item-title>{{ user?.user }} <v-icon color="primary" size="small" @click="handleLogout" class="ml-5 float-right">mdi-logout</v-icon></v-list-item-title>
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
import { useTheme } from 'vuetify'

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
