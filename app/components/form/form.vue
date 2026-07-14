<template>
  <component :is="noCard ? 'div' : 'v-card'" :variant="noCard ? undefined : 'outlined'" :class="noCard ? '' : 'pa-4 mt-4'">
    <v-form v-model="isValid" ref="formRef" @submit.prevent="submit">
      <template v-for="header in headers" :key="header.key">
        <FormSetStringLine
          v-if="header.set_type === 'string_line'"
          v-model="formData[header.key]"
          :header="header"
          :rules="getRules(header.key)"
        />
        <FormSetEnumTag
          v-else-if="header.set_type === 'enum' && header.select_type === 'multiple'"
          v-model="formData[header.key]"
          :header="header"
          :rules="getRules(header.key)"
        />
        <FormSetEnum
          v-else-if="header.set_type === 'enum'"
          v-model="formData[header.key]"
          :header="header"
          :rules="getRules(header.key)"
        />
        <FormSetPasswordConfirm
          v-else-if="header.set_type === 'password_confirm'"
          v-model="formData[header.key]"
          :header="header"
          :rules="getRules(header.key)"
        />
      </template>
      
      <div class="d-flex justify-end mt-4">
        <v-btn v-if="cancelBtn" variant="text" class="me-2" @click="$emit('cancel')">
          {{ t('form.cancel') }}
        </v-btn>
        <v-btn color="primary" type="submit" :disabled="!isValid" :loading="loading">
          {{ t('form.submit') }}
        </v-btn>
      </div>
    </v-form>
  </component>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useI18n } from 'vue-i18n'

const props = withDefaults(defineProps<{
  headers: any[]
  initialData?: any
  cancelBtn?: boolean
  loading?: boolean
  noCard?: boolean
}>(), {
  cancelBtn: true,
  loading: false,
  noCard: false
})

const emit = defineEmits(['submit', 'cancel'])
const { t } = useI18n()

const isValid = ref(false)
const formRef = ref(null)

// Seed formData: start from initialData, then fill missing keys with header defaults
const seedData: Record<string, any> = { ...props.initialData }
props.headers.forEach(h => {
  if (h.key && seedData[h.key] === undefined && h.set_type) {
    if (h.default !== undefined) {
      seedData[h.key] = Array.isArray(h.default) ? [...h.default] : h.default
    } else if (h.set_type === 'string_line') {
      seedData[h.key] = ''
    } else if (h.select_type === 'multiple') {
      seedData[h.key] = []
    } else {
      seedData[h.key] = null
    }
  }
})
const formData = reactive(seedData)

const getRules = (key: string) => {
  const rules = props.headers.find((h: any) => h.key === key)?.rules;
  if (!rules) return [];
  const ruleList = Array.isArray(rules) ? rules : [rules];
  // Wrap each rule so any string result (i18n key) is translated
  return ruleList.map((rule: any) => (v: any) => {
    const result = rule(v);
    if (typeof result === 'string') return t(result);
    return result;
  });
}

const submit = () => {
    if (isValid.value) {
        emit('submit', { ...formData })
    }
}
</script>
