<template>
  <div class="d-flex align-center ga-2 px-3 py-2 border-b">
    <EventLevelFilter :model-value="levels" :counts="counts" @update:model-value="emit('update:levels', $event)" />
    <span class="text-subtitle-1 font-weight-bold text-primary text-truncate text-center flex-grow-1 px-1" :title="title">
      {{ title }}
    </span>
    <div class="d-flex align-center flex-shrink-0">
      <v-btn icon variant="text" size="small" :disabled="!shownCount" @click="emit('select-all')">
        <v-icon size="20">{{ allSelected ? 'mdi-checkbox-multiple-blank-outline' : 'mdi-checkbox-multiple-marked-outline' }}</v-icon>
      </v-btn>
      <v-btn icon variant="text" size="small" color="error" :disabled="!selectedCount" @click="emit('delete')">
        <v-badge :model-value="selectedCount > 0" :content="selectedCount" color="error" floating>
          <v-icon size="20">mdi-delete-outline</v-icon>
        </v-badge>
      </v-btn>
      <v-btn icon variant="text" size="small" @click="emit('close')">
        <v-icon size="20">mdi-close</v-icon>
      </v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
// Header of an event list (bell, dashboard events): level filter, title, select all shown / none, delete the
// selected events, close. Rows are selected by clicking them; the list itself is the caller's.
import EventLevelFilter, { type EventLevel } from './event_level_filter.vue'

defineProps<{
  title: string
  levels: EventLevel[]
  counts?: Partial<Record<EventLevel, number>>
  shownCount: number
  selectedCount: number
  allSelected: boolean
}>()

const emit = defineEmits<{
  (e: 'update:levels', value: EventLevel[]): void
  (e: 'select-all'): void
  (e: 'delete'): void
  (e: 'close'): void
}>()
</script>
