<template>
  <branding_panel> 
      <v-card width="400" elevation="8" class="pa-4">
        <v-card-title class="text-center text-h5 mb-2">
          {{ $t('frontend.auth.login_title') }}
        </v-card-title>
        <v-card-subtitle class="text-center mb-6">
          {{ $t('frontend.auth.login_instructions') }}
        </v-card-subtitle>

        <Form
          :headers="loginSchema.headers"
          :cancel-btn="false"
          :loading="loading"
          @submit="handleLogin"
        />

        <v-card-actions class="justify-center">
          <v-btn variant="text" to="/register"  class="text-none">
            {{ $t('frontend.auth.no_account') }}
          </v-btn>
        </v-card-actions>
      </v-card>
  </branding_panel>
</template>

<script setup lang="ts">
import { apiPost } from '~/util/fetch/wrappers'
import Form from '~/components/form/form.vue'
import getSchema from '~/schemas/login'

const { t } = useI18n()
const loginSchema = getSchema(t)

definePageMeta({
  layout: 'default',
  middleware: [
    function() {
      const { loggedIn } = useUserSession()
      if (loggedIn.value) {
        return navigateTo('/')
      }
    }
  ]
})

const { fetch: fetchSession } = useUserSession()
const loading = ref(false)

const handleLogin = async (data: any) => {
  if (!data.user || !data.password) return

  loading.value = true
  try {
    await apiPost('/api/auth/login', {
      user: data.user,
      password: data.password
    })

    // Slightly pause enforcing browser session tracking resolving 
    await new Promise(resolve => setTimeout(resolve, 50))
    await fetchSession()

    return navigateTo('/')
  } catch (err: any) {
    // Expected rejections caught silently, API errors emit via notify automatically
    console.error('Login action halted due to an API error.')
  } finally {
    loading.value = false
  }
}
</script>
