<template>
  <v-textarea
    v-model="internalValue"
    :label="header.title"
    :placeholder="header.opts?.placeholder"
    :persistent-placeholder="!!header.opts?.placeholder"
    :rules="rules"
    :counter="header.opts?.max_chars"
    :persistent-counter="!!header.opts?.max_chars"
    variant="outlined"
    density="comfortable"
    :hide-details="header.opts?.max_chars ? false : 'auto'"
    class="mb-3"
    :rows="header.opts?.rows || 3"
    :auto-grow="header.opts?.auto_grow !== false"
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
