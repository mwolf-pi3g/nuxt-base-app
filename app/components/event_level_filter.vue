<template>
  <div class="d-flex align-center ga-1">
    <v-chip
      v-for="level in LEVELS"
      :key="level.key"
      size="small"
      :variant="isOn(level.key) ? 'flat' : 'outlined'"
      :color="isOn(level.key) ? level.color : 'medium-emphasis'"
      :prepend-icon="level.icon"
      class="px-2"
      @click="toggle(level.key)"
    >
      {{ counts?.[level.key] ?? 0 }}
    </v-chip>
  </div>
</template>

<script lang="ts">
export type EventLevel = 'info' | 'warn' | 'error'
</script>

<script setup lang="ts">
// Level filter for event lists (bell, dashboard events): one chip per level with its icon and how many of the shown
// events have it; filled = shown, outlined = hidden. Numbers and icons only, nothing to translate.

const LEVELS: Array<{ key: EventLevel; icon: string; color: string }> = [
  { key: 'info', icon: 'mdi-information', color: 'info' },
  { key: 'warn', icon: 'mdi-alert', color: 'warning' },
  { key: 'error', icon: 'mdi-alert-circle', color: 'error' },
]

const props = defineProps<{ modelValue: EventLevel[]; counts?: Partial<Record<EventLevel, number>> }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: EventLevel[]): void }>()

const isOn = (level: EventLevel) => props.modelValue.includes(level)
const toggle = (level: EventLevel) =>
  emit('update:modelValue', isOn(level) ? props.modelValue.filter((l) => l !== level) : [...props.modelValue, level])
</script>
