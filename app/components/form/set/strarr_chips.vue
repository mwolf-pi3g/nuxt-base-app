<template>
  <v-select
    v-model="internalValue"
    item-title="name"
    item-value="id"
    :items="resolvedItems"
    :label="header.title"
    :rules="rules"
    multiple
    variant="outlined"
    density="comfortable"
    hide-details="auto"
    class="mb-3"
  >
    <template v-slot:selection="{ item, index }">
      <v-chip
        v-if="index < maxChips"
        size="small"
        closable
        :style="item.raw?.color || item.color"
        class="font-weight-bold"
        @click:close="remove(item)"
      >
        {{ item.raw?.name || item.name || item.title }}
      </v-chip>
      <span
        v-if="index === maxChips"
        class="text-grey text-caption ms-1 align-self-center"
      >
        (+{{ internalValue.length - maxChips }})
      </span>
    </template>
  </v-select>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import strColor from '#ba/util/str_color'

const props = defineProps<{
  modelValue: any
  header: any
  rules?: any[]
}>()

const emit = defineEmits(['update:modelValue'])

const maxChips = 3

const resolvedItems = computed(() => {
  const enum_values = props.header.enum_values
  if (enum_values) {
    return enum_values
  }
  const vals = props.modelValue || []
  return vals.map((v: string) => ({ id: v, name: v }))
})

const remove = (item: any) => {
  const val = item && typeof item === 'object' ? ('value' in item ? item.value : (item.id || item)) : item
  internalValue.value = internalValue.value.filter((v: any) => {
    const currentVal = v && typeof v === 'object' && 'id' in v ? v.id : v
    return currentVal !== val
  })
}

const internalValue = computed({
  get: () => {
    const enum_values = resolvedItems.value
    const color_delimiter = props.header.color_delimiter
    const vals = props.modelValue || []
    return vals.map((v: string) => {
      const found = enum_values.find((e: any) => e.id === v)
      const name = found ? found.name : v
      const color_name = color_delimiter ? name.split(color_delimiter)[0] : name
      const color = strColor(color_name)
      return { name, color, id: v }
    })
  },
  set: (val) => {
    const mapped = (val || []).map((v: any) => v && typeof v === 'object' && 'id' in v ? v.id : v)
    emit('update:modelValue', mapped)
  }
})

onMounted(() => {
  if (props.modelValue === undefined) {
    emit('update:modelValue', internalValue.value)
  }
})
</script>
