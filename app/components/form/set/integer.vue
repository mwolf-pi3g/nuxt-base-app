<template>
  <v-number-input
    v-model="internalValue"
    :label="header.title"
    :rules="rules"
    variant="outlined"
    density="comfortable"
    hide-details="auto"
    class="mb-3"
    :min="header.min"
    :max="header.max"
    :step="header.step || 1"
  />
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'

const props = defineProps<{
  modelValue: any
  header: any
  rules?: any[]
}>()

const emit = defineEmits(['update:modelValue'])

const internalValue = computed({
  get: () => {
    if (props.modelValue !== undefined) return props.modelValue
    return props.header.default !== undefined ? props.header.default : null
  },
  set: (val) => {
    const num = val === null || val === undefined || val === '' ? null : Number(val)
    emit('update:modelValue', num)
  }
})

onMounted(() => {
  if (props.modelValue === undefined && internalValue.value !== null) {
    emit('update:modelValue', internalValue.value)
  }
})
</script>
