<template>
  <branding_panel> 
    <v-card width="450" elevation="8" class="pa-4">
      <v-card-title class="text-center text-h5 mb-2">
        {{ t('frontend.auth.signup_title') }}
      </v-card-title>
      <v-card-subtitle class="text-center mb-6 text-wrap">
        <div v-for="(item, index) in $tm('frontend.auth.signup_instructions')" :key="index">
          {{ $rt(item) }}
        </div>
      </v-card-subtitle>

      <Form
        :headers="registerSchema.headers"
        :cancel-btn="false"
        :loading="loading"
        @submit="handleSignup"
      />

      <v-card-actions class="justify-center">
        <v-btn variant="text" to="/login" color="secondary" class="text-none">
          {{ t('frontend.auth.have_account') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </branding_panel>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { apiPost } from '~/util/fetch/wrappers'
import Form from '~/components/form/form.vue'
import getSchema from '~/schemas/register'

const { t, locale } = useI18n()
const registerSchema = getSchema(t)

definePageMeta({
  layout: 'default'
})

const loading = ref(false)

const handleSignup = async (data: any) => {
  loading.value = true
  try {
    await apiPost('/api/auth/register', {
      user: data.user,
      password: data.password,
      lang: locale.value
    })
    
    // Redirect to login or show success message
    return navigateTo('/login')
  } catch (err: any) {
    // API errors emit via notify automatically
  } finally {
    loading.value = false
  }
}
</script>
