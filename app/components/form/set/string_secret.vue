<template>
  <v-text-field
    v-model="internalValue"
    :label="header.title"
    :rules="rules"
    :type="visible ? 'text' : 'password'"
    :append-inner-icon="visible ? 'mdi-eye-off' : 'mdi-eye'"
    @click:append-inner="visible = !visible"
    variant="outlined"
    density="comfortable"
    hide-details="auto"
    class="mb-3"
  />
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'

const props = defineProps<{
  modelValue: any
  header: any
  rules?: any[]
}>()

const emit = defineEmits(['update:modelValue'])
const visible = ref(false)

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
