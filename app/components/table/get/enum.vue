<template>
  <span>{{ displayText }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  model: any
  enum_values?: any
}>()

const displayText = computed(() => {
  const getVal = (val: any) => {
    if (Array.isArray(props.enum_values)) {
      // Only if enum_values is a list of objects, do the lookup.
      const first = props.enum_values[0]
      if (first && typeof first === 'object' && 'value' in first) {
        const found = props.enum_values.find(item => item && item.value === val)
        return found ? found.title : val
      }
      return val
    }
    if (props.enum_values && typeof props.enum_values === 'object') {
      return props.enum_values[val] !== undefined ? props.enum_values[val] : val
    }
    return val
  }

  if (Array.isArray(props.model)) {
    return props.model.map(getVal).join(', ')
  }
  return getVal(props.model)
})
</script>
