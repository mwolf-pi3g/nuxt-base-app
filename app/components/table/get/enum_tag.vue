<template>
  <div class="d-flex flex-wrap">
    <v-chip
      v-for="(label, index) in activeLabels"
      :key="index"
      size="x-small"
      class="me-1 mb-1"
      variant="tonal"
      color="primary"
    >
      {{ label }}
    </v-chip>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  model: boolean[]
  enumValues: string | string[]
}>()

const { tm, rt } = useI18n()

const labels = computed(() => {
  if (Array.isArray(props.enumValues)) {
    return props.enumValues
  }
  const localized = tm(props.enumValues)
  if (Array.isArray(localized)) {
    return localized.map((l: any) => rt(l))
  }
  return []
})

const activeLabels = computed(() => {
  if (!Array.isArray(props.model)) return []
  return labels.value.filter((_, index) => props.model[index])
})
</script>
