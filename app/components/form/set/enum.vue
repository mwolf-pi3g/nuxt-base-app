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
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  modelValue: any
  header: any
  rules?: any[]
}>()

const emit = defineEmits(['update:modelValue'])
const { tm, rt } = useI18n()

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

const firstItemValue = computed(() => {
  const list = items.value
  if (!list || list.length === 0) return null
  const first = list[0]
  if (typeof first === 'object' && first !== null && first.value !== undefined) {
    return first.value
  }
  return first
})

const internalValue = computed({
  get: () => {
    if (props.modelValue !== undefined && props.modelValue !== null && props.modelValue !== '') {
      return props.modelValue
    }
    if (props.header.default !== undefined && props.header.default !== null && props.header.default !== '') {
      return props.header.default
    }
    return firstItemValue.value
  },
  set: (val) => emit('update:modelValue', val)
})

watch(
  [() => props.modelValue, internalValue],
  ([val, currentInternal]) => {
    if ((val === undefined || val === null || val === '') && currentInternal !== null && currentInternal !== undefined) {
      emit('update:modelValue', currentInternal)
    }
  },
  { immediate: true }
)
</script>
