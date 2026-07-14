<template>
  <span>{{ formattedDate }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  model: string | Date | number
}>()

const formattedDate = computed(() => {
  if (!props.model) return ''
  const date = new Date(props.model)
  if (isNaN(date.getTime())) return String(props.model)
  
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const mo = String(date.getMonth() + 1).padStart(2, '0')
  const yy = String(date.getFullYear()).slice(-2)
  
  return `${hh}:${mm} ${dd}.${mo}.${yy}`
})
</script>
