<template>
  <v-menu v-model="menuOpen" :close-on-content-click="false" location="bottom end" offset="8">
    <template v-slot:activator="{ props }">
      <v-btn icon v-bind="props" class="mx-1" :color="streamDown ? 'error' : undefined">
        <v-badge
          :model-value="!streamDown && badgeCount > 0"
          :content="badgeContent"
          :color="mostSevereColor"
          location="top end"
          offset-x="3"
          offset-y="3"
        >
          <v-icon>{{ streamDown ? 'mdi-bell-alert-outline' : 'mdi-bell-outline' }}</v-icon>
        </v-badge>
      </v-btn>
    </template>

    <v-card min-width="380" max-width="460" rounded="lg" elevation="6">
      <!-- No live updates: one message instead of a list that may be out of date -->
      <div v-if="streamDown" class="d-flex align-center ga-3 pa-4">
        <v-icon color="error">mdi-lan-disconnect</v-icon>
        <span class="text-body-2">{{ t('events.stream_down') }}</span>
      </div>
      <EventList
        v-else
        :title="$t('events.title')"
        :events="events"
        :loading="loading"
        :has-more="!!cursor"
        max-height="420px"
        @close="menuOpen = false"
        @deleted="onDeleted"
        @more="fetchEvents(true)"
      >
        <!-- Summary lines (app config userEvents.summaries): categories shown elsewhere, with problems -->
        <template #before>
          <div
            v-for="summary in activeSummaries"
            :key="summary.category"
            class="d-flex align-center ga-3 px-3 py-2 border-b cursor-pointer"
            @click="openSummary(summary)"
          >
            <v-icon :color="getEventColor(summary.level)" size="small">{{ getEventIcon(summary.level) }}</v-icon>
            <span class="text-body-2 font-weight-bold flex-grow-1">{{ t(summary.message, { count: summary.count }) }}</span>
            <v-icon size="small" color="medium-emphasis">mdi-chevron-right</v-icon>
          </div>
        </template>
      </EventList>
    </v-card>
  </v-menu>
</template>

<script setup lang="ts">
// The bell: the user's events, newest first, updated live (useUserStream; red with one message while it can't connect). Events stay until the user deletes them (select rows, delete) or they
// pass the retention (server/cron/truncate_user_events.ts). The badge counts the warnings and errors.
// App config userEvents (app/app.config.ts) leaves categories out and adds summary lines for them.
import { ref, computed, watch, onMounted } from 'vue'
import { apiGet } from '~/utils/fetch/wrappers'
import EventList from './event_list.vue'
import type { EventLevel } from './event_level_filter.vue'

interface UserEventItem {
  id: string
  level: string
  message: string
  category?: string | null
  metadata?: Record<string, any>
  createdAt: string | Date
}

const { t } = useI18n()
const router = useRouter()

const settings = computed(() => (useAppConfig() as any).userEvents ?? {})
const excludeCategories = computed<string[]>(() => settings.value.excludeCategories ?? [])

interface Summary { category: string; message: string; to: string; count: number; level: 'error' | 'warn' }
const summaries = ref<Summary[]>([])
const activeSummaries = computed(() => summaries.value.filter(s => s.count > 0))

const events = ref<UserEventItem[]>([])
const loading = ref(false)
const menuOpen = ref(false)
const streamState = useUserStreamState()
const streamDown = computed(() => streamState.value === 'down')

// 'warning' is stored by older code; it is the same level as 'warn'
const levelOf = (level?: string): EventLevel => {
  const l = level?.toLowerCase()
  return l === 'error' ? 'error' : (l === 'warn' || l === 'warning') ? 'warn' : 'info'
}

// The badge counts what needs attention: warnings and errors, plus the records behind the summary lines
const problems = computed(() => events.value.filter(e => levelOf(e.level) !== 'info'))
const badgeCount = computed(() => problems.value.length + activeSummaries.value.reduce((n, s) => n + s.count, 0))

// If 100 items retrieved and the count is >= 100, show 100+
const badgeContent = computed(() => (badgeCount.value >= 100 ? '100+' : badgeCount.value))

const mostSevereColor = computed(() => {
  const errors = problems.value.some(e => levelOf(e.level) === 'error') || activeSummaries.value.some(s => s.level === 'error')
  return errors ? 'error' : 'warning'
})

const getEventIcon = (level: string) => {
  switch (levelOf(level)) {
    case 'error': return 'mdi-alert-circle'
    case 'warn': return 'mdi-alert'
    default: return 'mdi-information'
  }
}

const getEventColor = (level: string) => {
  switch (levelOf(level)) {
    case 'error': return 'error'
    case 'warn': return 'warning'
    default: return 'info'
  }
}

// The events of the categories the bell shows, newest first, 100 at a time: `older` appends the next 100 (the
// server's cursor); otherwise the newest 100 replace the list. The level filter works on what is loaded.
const cursor = ref<string | null>(null)
let browsingOlder = false     // older events loaded: live updates leave the list alone until the bell is opened again
const fetchEvents = async (older = false) => {
  if (older && !cursor.value) return
  try {
    loading.value = true
    const queryParams = new URLSearchParams({ limit: '100', sortBy: 'createdAt', sortDir: 'desc' })
    if (excludeCategories.value.length) queryParams.set('excludeCategory', excludeCategories.value.join(','))
    if (older) queryParams.set('cursor', cursor.value!)

    const res = await apiGet(`/api/user/event/search?${queryParams.toString()}`)
    if (res?.data && Array.isArray(res.data)) {
      events.value = older ? [...events.value, ...res.data] : res.data
      cursor.value = res.cursor ?? null
      browsingOlder = older
    }
  } catch (err) {
    console.error('Failed to fetch user events:', err)
  } finally {
    loading.value = false
  }
}

// Per summary: the distinct records (metadata.id) with warnings or errors in its category
const fetchSummaries = async () => {
  const configured: Array<{ category: string; message: string; to: string }> = settings.value.summaries ?? []
  summaries.value = await Promise.all(configured.map(async (summary) => {
    try {
      const queryParams = new URLSearchParams({
        limit: '100', sortBy: 'createdAt', sortDir: 'desc', level: 'warn,warning,error', category: summary.category,
      })
      const res = await apiGet(`/api/user/event/search?${queryParams.toString()}`)
      const found: UserEventItem[] = Array.isArray(res?.data) ? res.data : []
      const records = new Set(found.map(e => e.metadata?.id ?? e.metadata?.name ?? e.id))
      const level = found.some(e => levelOf(e.level) === 'error') ? 'error' : 'warn'
      return { ...summary, count: records.size, level }
    } catch {
      return { ...summary, count: 0, level: 'warn' as const }
    }
  }))
}

const onDeleted = (ids: string[]) => {
  events.value = events.value.filter(e => !ids.includes(e.id))
  fetchSummaries()
}

const openSummary = (summary: Summary) => {
  menuOpen.value = false
  router.push(summary.to)
}

// Opening the bell shows the newest events again; a live update too, unless older ones were loaded meanwhile
const refresh = (live = false) => {
  if (!(live && browsingOlder)) fetchEvents()
  fetchSummaries()
}

// Opening the bell shows the current state
watch(menuOpen, (open) => { if (open) refresh() })

onMounted(() => refresh())

// Live updates (no polling): a stored or deleted event, and every (re)connect of the stream
useUserStream(['events'], () => refresh(true))
</script>
