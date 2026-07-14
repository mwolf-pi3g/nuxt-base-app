// https://nuxt.com/docs/api/configuration/nuxt-config

import { createResolver, defineNuxtModule } from "@nuxt/kit"
const { resolve } = createResolver(import.meta.url)

export default defineNuxtConfig({
  $meta: {
    name: 'nuxt-base-app',
  },
  alias: {
    '#bs': resolve('./server')
  },
  exclude: [
    "**/.data/**", ".data"
  ],
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['nuxt-cron', 'vuetify-nuxt-module', '@nuxtjs/i18n', 'nuxt-auth-utils', '@nuxthub/core',
  ],
  hub: {
    db: 'sqlite'
  },
  vite: {
    optimizeDeps: {
      exclude: ['drizzle-orm', 'better-sqlite3']
    }
  },
  i18n: {
    lazy: true,             // Best for performance: only loads the current language
    langDir: 'locales',     // Folder name
    locales: [
      { code: 'en', file: 'en.json', name: 'English' },
      { code: 'de', file: 'de.json', name: 'Deutsch' }
    ],
    defaultLocale: 'en',
    strategy: 'no_prefix',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      alwaysRedirect: true
    }
  },
  vuetify: {
    moduleOptions: {
      /* module specific options */
    },
    vuetifyOptions: {
      theme: {
        defaultTheme: 'light',
        themes: {
          light: {
            colors: {
              primary: '#1976D2',
              secondary: '#424242',
            },
          },
          dark: {
            colors: {
              primary: '#2196F3',
              secondary: '#424242',
            },
          },
        },
      },
    }
  }
})
