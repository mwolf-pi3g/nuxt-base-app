<template>
  <div ref="root" class="event-list d-flex flex-column min-h-0">
    <EventPanelHeader
      v-model:levels="levels"
      :title="title"
      :counts="levelCounts"
      :shown-count="shownEvents.length"
      :selected-count="selected.size"
      :all-selected="allShownSelected"
      @select-all="toggleSelectAll"
      @delete="deleteSelected"
      @close="emit('close')"
    />

    <div class="event-list__body flex-grow-1 overflow-y-auto" :style="maxHeight ? { maxHeight } : undefined">
      <!-- Lines the caller puts above the events (e.g. the bell's summaries) -->
      <slot name="before" />

      <div v-if="loading && events.length === 0" class="text-center py-6">
        <v-progress-circular indeterminate size="24" color="primary" />
      </div>

      <div v-else-if="pageEvents.length === 0" class="text-center py-6 text-caption text-medium-emphasis">
        {{ $t('events.no_events') }}
      </div>

      <!-- Clicking a row selects it; a selected row has its level's light shade and a left edge in the level color -->
      <template v-else>
        <div
          v-for="item in pageEvents"
          :key="item.id"
          class="event-list__row d-flex align-start ga-3 px-3 py-2 border-b cursor-pointer"
          :class="selected.has(item.id) ? `bg-${levelColor(item.level)}-lighten-5 border-s-lg border-${levelColor(item.level)} border-opacity-100` : ''"
          @click="toggleSelect(item.id)"
        >
          <v-icon :color="levelColor(item.level)" size="small" class="mt-1 flex-shrink-0">{{ levelIcon(item.level) }}</v-icon>

          <!-- Wide: date as its own column; narrow: the date goes under the message -->
          <span v-if="wide" class="event-list__date text-caption text-medium-emphasis flex-shrink-0 pt-1">{{ formatDate(item.createdAt) }}</span>

          <div class="flex-grow-1 min-w-0">
            <div class="text-body-2 text-wrap">{{ formatMessage(item) }}</div>
            <!-- Optional links in metadata.links: [{ label, url }] (e.g. the emails a failure affected) -->
            <div v-if="linksOf(item).length" class="text-caption mt-1 d-flex flex-wrap ga-2">
              <a v-for="(link, i) in linksOf(item)" :key="i" :href="link.url" target="_blank" rel="noopener"
                 class="text-primary" @click.stop>{{ link.label || link.url }}</a>
            </div>
            <div v-if="!wide" class="text-caption text-medium-emphasis mt-1">{{ formatDate(item.createdAt) }}</div>
          </div>
        </div>
      </template>
    </div>

    <!-- Paging over the loaded events; older ones are loaded on request (the caller follows the server's cursor) -->
    <div v-if="shownEvents.length > pageSize || hasMore" class="d-flex align-center justify-end ga-1 px-3 py-1 border-t">
      <v-btn v-if="hasMore" size="x-small" variant="text" color="primary" class="mr-auto event-list__more" :loading="loading" @click="emit('more')">
        {{ $t('events.show_older') }}
      </v-btn>
      <template v-if="shownEvents.length > pageSize">
        <span class="text-caption text-medium-emphasis mr-2">{{ pageStart + 1 }}-{{ pageEnd }} / {{ shownEvents.length }}</span>
        <v-btn icon="mdi-chevron-left" size="x-small" variant="text" :disabled="page <= 1" @click="page--" />
        <v-btn icon="mdi-chevron-right" size="x-small" variant="text" :disabled="pageEnd >= shownEvents.length" @click="page++" />
      </template>
    </div>
  </div>
</template>

<script lang="ts">
export interface EventListItem {
  id: string
  level: string
  message: string
  category?: string | null
  metadata?: Record<string, any> | string
  createdAt: string | Date
}
</script>

<script setup lang="ts">
// An event list (bell, dashboard events): level filter, select rows by clicking, delete the selected ones, paging.
// The caller fetches the events and removes the deleted ones (event 'deleted'); with has-more it also loads older
// ones on 'more' and appends them. The layout follows the list's own
// width (not the window's): narrow = stacked rows, wide = the date in its own column.
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { apiDelete } from '~/utils/fetch/wrappers'
import EventPanelHeader from './event_panel_header.vue'
import type { EventLevel } from './event_level_filter.vue'

const props = withDefaults(defineProps<{
  title: string
  events: EventListItem[]
  loading?: boolean
  maxHeight?: string          // e.g. '380px' in a menu; without it the list fills its container
  pageSize?: number
  hasMore?: boolean           // older events exist on the server: shows "Show older", which emits 'more'
}>(), { loading: false, maxHeight: undefined, pageSize: 20, hasMore: false })

const emit = defineEmits<{ (e: 'close'): void; (e: 'deleted', ids: string[]): void; (e: 'more'): void }>()

const { t, te, locale } = useI18n()

// Width of the list itself
const WIDE_FROM_PX = 560
const root = ref<HTMLElement | null>(null)
const wide = ref(false)
let observer: ResizeObserver | null = null
onMounted(() => {
  observer = new ResizeObserver(([entry]) => { wide.value = (entry?.contentRect.width ?? 0) >= WIDE_FROM_PX })
  if (root.value) observer.observe(root.value)
})
onUnmounted(() => observer?.disconnect())

// 'warning' is stored by older code; it is the same level as 'warn'
const levelOf = (level?: string): EventLevel => {
  const l = level?.toLowerCase()
  return l === 'error' ? 'error' : (l === 'warn' || l === 'warning') ? 'warn' : 'info'
}
const levelColor = (level?: string) => ({ error: 'error', warn: 'warning', info: 'info' })[levelOf(level)]
const levelIcon = (level?: string) => ({ error: 'mdi-alert-circle', warn: 'mdi-alert', info: 'mdi-information' })[levelOf(level)]

const levels = ref<EventLevel[]>(['info', 'warn', 'error'])
const levelCounts = computed(() => {
  const counts: Record<EventLevel, number> = { info: 0, warn: 0, error: 0 }
  for (const e of props.events) counts[levelOf(e.level)]++
  return counts
})
const shownEvents = computed(() => props.events.filter(e => levels.value.includes(levelOf(e.level))))

// Paging over the shown events
const page = ref(1)
const pageStart = computed(() => (page.value - 1) * props.pageSize)
const pageEnd = computed(() => Math.min(pageStart.value + props.pageSize, shownEvents.value.length))
const pageEvents = computed(() => shownEvents.value.slice(pageStart.value, pageEnd.value))
watch([levels, () => props.events.length], () => {
  const last = Math.max(1, Math.ceil(shownEvents.value.length / props.pageSize))
  if (page.value > last) page.value = last
})

// Selection: clicking a row toggles it; select all applies to every shown event (all pages)
const selected = ref(new Set<string>())
watch(() => props.events, (events) => {
  const ids = new Set(events.map(e => e.id))
  selected.value = new Set([...selected.value].filter(id => ids.has(id)))
})
const toggleSelect = (id: string) => {
  const next = new Set(selected.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  selected.value = next
}
const allShownSelected = computed(() => shownEvents.value.length > 0 && shownEvents.value.every(e => selected.value.has(e.id)))
const toggleSelectAll = () => {
  selected.value = allShownSelected.value ? new Set() : new Set(shownEvents.value.map(e => e.id))
}

const deleteSelected = async () => {
  const ids = [...selected.value]
  if (ids.length === 0) return
  try {
    await apiDelete('/api/user/event', { ids })
    selected.value = new Set()
    emit('deleted', ids)
  } catch (err) {
    console.error('Failed to delete user events:', err)
  }
}

const metaOf = (item: EventListItem): Record<string, any> => {
  if (typeof item.metadata !== 'string') return item.metadata ?? {}
  try { return JSON.parse(item.metadata) } catch { return {} }
}
const linksOf = (item: EventListItem): Array<{ label?: string; url: string }> => {
  const links = metaOf(item).links
  return Array.isArray(links) ? links : []
}
const formatMessage = (item: EventListItem) => (te(item.message) ? t(item.message, metaOf(item)) : item.message)

const formatDate = (val: string | Date) => {
  const d = new Date(val)
  return isNaN(d.getTime()) ? String(val) : d.toLocaleString(locale.value, { dateStyle: 'short', timeStyle: 'medium' })
}
</script>

<style scoped>
.event-list__date {
  white-space: nowrap;
  min-width: 10em;
}
</style>
