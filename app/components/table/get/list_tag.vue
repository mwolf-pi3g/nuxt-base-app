<template>
  <div class="d-flex flex-wrap gap-1 align-center" v-tooltip="tooltipText">
    <v-chip
      v-for="item in model.slice(0, 3)"
      :key="item"
      size="small"
      class="ma-1 font-weight-bold"
      :style="chipStyle(item)"
    >
      {{ getValue(item) }}
    </v-chip>
    <span
      v-if="model.length > 3"
      class="text-grey text-caption ms-1 align-self-center font-weight-bold"
    >
      (+{{ model.length - 3 }})
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import strColor from '#ba/util/str_color'

const props = defineProps<{
  model: string[]
  color_delimiter?: string
  enum_values?: {id: string, name: string}[]
}>()

const tooltipText = computed(() => {
  return props.model?.map(item => getValue(item)).join('\n')
})

const getValue = (item: string) => {
  const enumVals = props.enum_values
  if (enumVals && enumVals.length > 0 && typeof enumVals[0] === 'object') {
    const enumValue = enumVals.find((e) => e.id === item)
    if (enumValue) return enumValue.name
  }
  return item
}

const chipStyle = (item: string) => {
  const prefix = getString(item) || 'BADPARSE'
  return strColor(prefix)
}

const getString = (item: string) => {
  if (!item) return undefined
  const val = getValue(item)
  const delimiter = props.color_delimiter
  if (delimiter) {
    return val.split(delimiter)[0]
  }
  return val
}
</script>
