<template>
  <v-icon
    :color="isActive ? 'success' : 'grey-lighten-1'"
    :icon="isActive ? 'mdi-check-circle-outline' : 'mdi-circle-outline'"
    size="small"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  model: any
}>()

const isActive = computed(() => {
  return props.model === 1 || props.model === true
})
</script>
