<template>
  <v-checkbox
    v-model="internalValue"
    :label="header.title"
    :rules="rules"
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
    return props.modelValue && true
  },
  set: (val: boolean) => {
    if (props.header.set_as_number) {
      emit('update:modelValue', val ? 1 : 0)
    } else {
      emit('update:modelValue', val)
    }
  }
})

onMounted(() => {
  if (props.modelValue === undefined) {
    emit('update:modelValue', internalValue.value)
  }
})
</script>
