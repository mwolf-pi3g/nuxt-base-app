<template>
  <v-select
    v-model="internalIndices"
    :items="items"
    item-title="label"
    item-value="index"
    :label="header.title"
    :rules="internal_rules"
    variant="outlined"
    density="comfortable"
    multiple
    closable-chips
    chips
    hide-details="auto"
    class="mb-3"
  />
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  modelValue: boolean[]
  header: any
  rules?: any[]
}>()

function createBooleanArray(indicesObj: Record<number, number>, size: number): boolean[] {
  const result = new Array(size).fill(false);
  Object.keys(indicesObj).forEach((key) => {
    const index = Number(key);
    if (index >= 0 && index < size) {
      result[index] = true;
    }
  });

  return result;
}

const internal_rules = computed(() => {
  if (!props.rules || props.rules.length === 0) return [() => true]
  return props.rules.map((rule: any) => (val: any) => rule(createBooleanArray(val, items.value.length)))
})

const emit = defineEmits(['update:modelValue'])
const { tm, rt } = useI18n()

// Build label list from i18n key or inline array
const items = computed(() => {
  let labels: string[] = []
  if (Array.isArray(props.header.enum_values)) {
    labels = props.header.enum_values as string[]
  } else if (typeof props.header.enum_values === 'string') {
    const raw = tm(props.header.enum_values) as unknown
    if (Array.isArray(raw)) {
      labels = (raw as any[]).map((l) => rt(l))
    }
  }
  return labels.map((label, index) => ({ label, index }))
})

// Internal state: array of selected indices (0-6)
const internalIndices = ref<number[]>([])

// Sync internalIndices FROM modelValue (boolean[] -> number[])
// Guard: only update if the index set actually changed to avoid loops
watch(
  props.modelValue,
  function (val) {
    const bools: boolean[] = Array.isArray(val) ? val : []
    const next = bools.reduce<number[]>((acc, b, i) => { if (b) acc.push(i); return acc }, [])
    const current = internalIndices.value
    const same = next.length === current.length && next.every((v, i) => v === current[i])
    if (!same) {
      internalIndices.value = next;
    }
  },
  { immediate: true }
)

// Sync modelValue FROM internalIndices (number[] -> boolean[])
watch(internalIndices, (indices) => {
  const count = items.value.length
  const newVal = new Array<boolean>(count).fill(false)
  for (const idx of indices) {
    if (idx < count) newVal[idx] = true
  }
  // Guard: only emit if the resulting boolean[] actually changed
  const current = props.modelValue || []
  const same = newVal.length === current.length && newVal.every((v, i) => v === current[i])
  if (!same) {
    emit('update:modelValue', newVal)
  }
})
</script>
