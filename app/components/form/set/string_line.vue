<template>
  <v-text-field
    v-model="internalValue"
    :label="header.title"
    :rules="rules"
    :type="header.type || 'text'"
    variant="outlined"
    density="comfortable"
    hide-details="auto"
    class="mb-3"
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
    return props.header.default !== undefined ? props.header.default : ''
  },
  set: (val) => emit('update:modelValue', val)
})

onMounted(() => {
  if (props.modelValue === undefined) {
    emit('update:modelValue', internalValue.value)
  }
})
</script>
