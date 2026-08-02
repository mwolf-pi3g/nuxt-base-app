<template>
  <div class="mb-3">
    <div class="v-label text-caption mb-1">{{ header.title }}</div>

    <FormWrapper :headers="modelValue" :initial-data="initialData" noSubmit @valid="v => $emit('valid', v)" />
  </div>
</template>

<script setup lang="ts">
// import { onMounted, watch } from 'vue'
import FormWrapper from '~/components/form/form.vue'


const props = defineProps<{
  modelValue: any,
  header: any,
  initialData: any
}>()

const emit = defineEmits(['valid'])

// Ensure we return a javascript object to the correct header variable
// const ensureObjectValue = () => {
//   if (!props.modelValue || typeof props.modelValue !== 'object') {
//     emit('update:modelValue', {})
//   }
// }

// onMounted(() => {
//   ensureObjectValue()
// })

// watch(() => props.formData, () => {
//   ensureObjectValue()
// }, { deep: true })
</script>
