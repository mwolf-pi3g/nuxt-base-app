<template>
  <div>
    <!-- Primary Password Field -->
    <v-text-field
      v-model="password"
      :label="header.title"
      type="password"
      :rules="rules"
      variant="outlined"
      density="comfortable"
      hide-details="auto"
      class="mb-3"
      @update:modelValue="updateValue"
    />
    
    <!-- Confirmation Password Field -->
    <v-text-field
      v-model="confirmPassword"
      :label="t('frontend.auth.confirm_password')"
      type="password"
      :rules="confirmRules"
      variant="outlined"
      density="comfortable"
      hide-details="auto"
      class="mb-3"
      @update:modelValue="updateValue"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  modelValue: string | null
  header: any
  rules?: any[]
}>()

const emit = defineEmits(['update:modelValue'])
const { t } = useI18n()

const password = ref(props.modelValue || '')
const confirmPassword = ref('')

const confirmRules = [
  (v: string) => !!v || t('rules.password.required'),
  (v: string) => v === password.value || t('rules.password.mismatch')
]

const updateValue = () => {
    // We emit the password value. The form isValid check will depend on both fields' rules passing.
    emit('update:modelValue', password.value)
}

watch(() => props.modelValue, (newVal) => {
    if (newVal !== password.value) {
        password.value = newVal || ""
    }
})
</script>
