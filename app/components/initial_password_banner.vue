<template>
  <v-banner v-if="active" color="warning" icon="mdi-shield-key-outline" lines="one" sticky class="initial-password-banner">
    <template #text>{{ t('frontend.auth.initial_password_banner') }}</template>
    <template #actions>
      <v-btn variant="text" to="/account">{{ t('frontend.auth.change_password') }}</v-btn>
    </template>
  </v-banner>
</template>

<script setup lang="ts">
// Shown while the account still signs in with ADMIN_PASSWORD (see server/services/core/initial_admin.ts)
import { ref, watch } from 'vue'

const { t } = useI18n()
const { loggedIn } = useUserSession()
const route = useRoute()
const active = ref(false)

const check = async () => {
  if (!loggedIn.value) {
    active.value = false
    return
  }
  try {
    active.value = !!(await $fetch<{ active: boolean }>('/api/user/account/initial_password')).active
  } catch {
    active.value = false
  }
}

// Re-check on navigation: after changing the password on /account the banner goes away
watch([loggedIn, () => route.path], check, { immediate: true })
</script>
