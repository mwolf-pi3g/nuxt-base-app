<template>
  <v-select
    v-model="internalValue"
    :items="items"
    :label="header.title"
    :rules="rules"
    variant="outlined"
    density="comfortable"
    hide-details="auto"
    class="mb-3"
  />
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  modelValue: any
  header: any
  rules?: any[]
}>()

const emit = defineEmits(['update:modelValue'])
const { tm, rt } = useI18n()

const internalValue = computed({
  get: () => {
    if (props.modelValue !== undefined) return props.modelValue
    return props.header.default !== undefined ? props.header.default : null
  },
  set: (val) => emit('update:modelValue', val)
})

onMounted(() => {
  if (props.modelValue === undefined) {
    emit('update:modelValue', internalValue.value)
  }
})

const items = computed(() => {
  if (Array.isArray(props.header.enum_values)) {
    return props.header.enum_values
  }
  const localized = tm(props.header.enum_values)
  if (Array.isArray(localized)) {
    return localized.map((l: any) => rt(l))
  }
  return []
})
</script>
