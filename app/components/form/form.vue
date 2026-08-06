<template>
  <component :is="noCard ? 'div' : 'v-card'" :variant="noCard ? undefined : 'outlined'" :class="noCard ? '' : 'pa-4 mt-4'">
    <v-form v-model="isValid" @submit.prevent="submit">
      <template v-for="header in headers" :key="header.key">
        <FormSetStringLine
          v-if="header.set_type === 'string_line'"
          v-model="formData[header.key]"
          :header="header"
          :rules="getRules(header.key)"
        />
        <FormSetStringArea
          v-else-if="header.set_type === 'string_area'"
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
        <FormSetStrarrChips
          v-else-if="header.set_type === 'strarr_chips'"
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
        <FormSetBoolean
          v-else-if="header.set_type === 'boolean'"
          v-model="formData[header.key]"
          :header="header"
          :rules="getRules(header.key)"
        />
        <FormSetInteger
          v-else-if="header.set_type === 'integer'"
          v-model="formData[header.key]"
          :header="header"
          :rules="getRules(header.key)"
        />

        <FormSetForm
          v-else-if="header.set_type === 'form' && resolvedSchemas[header.key]"
          v-model="resolvedSchemas[header.key]"
          :initial-data="formData[header.key]"
          :header="header"
          @valid="v => nestedValids[header.key] = v"
        />
      </template>
      <div v-if="!noSubmit" class="d-flex justify-end mt-4">
        <v-btn v-if="cancelBtn" variant="text" class="me-2" @click="$emit('cancel')">
          {{ t('form.cancel') }}
        </v-btn>
        <v-btn color="primary" type="submit" :disabled="!isFormValid" :loading="loading">
          {{ t('form.submit') }}
        </v-btn>
      </div>
    </v-form>
  </component>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const props = withDefaults(defineProps<{
  headers: any[]
  initialData?: any
  cancelBtn?: boolean
  loading?: boolean
  noCard?: boolean
  noSubmit?: boolean
}>(), {
  cancelBtn: true,
  loading: false,
  noCard: false,
  noSubmit: false
})



const emit = defineEmits(['submit', 'cancel', 'valid'])
const { t } = useI18n()

const isValid = ref(false)

// Seed formData: start from initialData, then fill missing keys with header defaults
const seedData = props.initialData && typeof props.initialData === 'object' ? props.initialData : {}
props.headers.forEach(h => {
  if (h.key && seedData[h.key] === undefined && h.set_type) {
    if (h.default !== undefined) {
      seedData[h.key] = Array.isArray(h.default) ? [...h.default] : h.default
    } else if (h.set_type === 'string_line') {
      seedData[h.key] = ''
    } else if (h.select_type === 'multiple') {
      seedData[h.key] = []
    } else if (h.set_type === 'form') {
      seedData[h.key] = {}
    } else {
      seedData[h.key] = null
    }
  }
})

const formData = reactive(seedData)
const resolvedSchemas = reactive<Record<string, any>>({})
const nestedValids = reactive<Record<string, boolean>>({})

const isFormValid = computed(() => {
  if (!isValid.value) return false
  for (const header of props.headers) {
    if (header.set_type === 'form' && resolvedSchemas[header.key]) {
      if (nestedValids[header.key] !== true) {
        return false
      }
    }
  }
  return true
})

watch(isValid, (newValid) => {
  emit('valid', newValid)
}, { immediate: true })

// deal with nested forms.  
watch(
  [() => props.headers, () => formData],
  async () => {
    for (const header of props.headers) {
      if (header.set_type === 'form') {
        if (!('value' in header)) {
          resolvedSchemas[header.key] = formData[header.key];
        } else if (typeof header.value === 'function') {
          resolvedSchemas[header.key] = await header.value(header, formData);
        } else {
          resolvedSchemas[header.key] = header.value;
        }
      }
    }
  },
  { immediate: true, deep: true }
)

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
  if (isFormValid.value && !props.noSubmit) {
    emit('submit', { ...formData })
  }
}
</script>
