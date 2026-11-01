<template>
  <v-menu v-model="menuOpen" :close-on-content-click="false" location="bottom end" offset="8">
    <template v-slot:activator="{ props }">
      <v-btn icon v-bind="props" class="mx-1">
        <v-badge
          :model-value="badgeCount > 0"
          :content="badgeContent"
          :color="mostSevereColor"
          location="top end"
          offset-x="3"
          offset-y="3"
        >
          <v-icon>mdi-bell-outline</v-icon>
        </v-badge>
      </v-btn>
    </template>

    <v-card min-width="380" max-width="460" rounded="lg" elevation="6">
      <EventPanelHeader
        v-model:levels="levels"
        :title="$t('events.title')"
        :counts="levelCounts"
        :shown-count="shownEvents.length"
        :selected-count="selected.size"
        :all-selected="allShownSelected"
        @select-all="toggleSelectAll"
        @delete="deleteSelected"
        @close="menuOpen = false"
      />

      <div style="max-height: 380px; overflow-y: auto;">
        <!-- Summary lines (app config userEvents.summaries): categories shown elsewhere, with problems -->
        <v-list v-if="activeSummaries.length" density="compact" class="py-0">
          <v-list-item
            v-for="summary in activeSummaries"
            :key="summary.category"
            class="py-2 px-4 border-b"
            style="cursor: pointer;"
            @click="openSummary(summary)"
          >
            <template v-slot:prepend>
              <v-icon :color="getEventColor(summary.level)" size="small" class="mr-2 opacity-100">{{ getEventIcon(summary.level) }}</v-icon>
            </template>
            <v-list-item-title class="font-weight-bold">{{ t(summary.message, { count: summary.count }) }}</v-list-item-title>
            <template v-slot:append>
              <v-icon size="small" color="medium-emphasis">mdi-chevron-right</v-icon>
            </template>
          </v-list-item>
        </v-list>

        <div v-if="loading && events.length === 0" class="text-center py-6">
          <v-progress-circular indeterminate size="24" color="primary" />
        </div>

        <div v-else-if="shownEvents.length === 0 && !activeSummaries.length" class="text-center py-6 text-caption text-medium-emphasis">
          {{ $t('events.no_events') }}
        </div>

        <!-- Clicking a row selects it; the header deletes the selected rows -->
        <v-list v-else-if="shownEvents.length" density="compact" class="py-0">
          <v-list-item
            v-for="item in shownEvents"
            :key="item.id"
            :active="selected.has(item.id)"
            color="primary"
            class="py-2 px-4 border-b"
            style="cursor: pointer;"
            @click="toggleSelect(item.id)"
          >
            <template v-slot:prepend>
              <v-icon :color="getEventColor(item.level)" size="small" class="mr-2 opacity-100">
                {{ getEventIcon(item.level) }}
              </v-icon>
            </template>

            <v-list-item-title class="text-wrap">
              {{ formatMessage(item) }}
            </v-list-item-title>

            <!-- Optional links in metadata.links: [{ label, url }] (e.g. the emails a failure affected) -->
            <div v-if="Array.isArray(item.metadata?.links) && item.metadata.links.length" class="text-caption mt-1 d-flex flex-wrap ga-2">
              <a v-for="(link, i) in item.metadata.links" :key="i" :href="link.url" target="_blank" rel="noopener"
                 class="text-primary" @click.stop>{{ link.label || link.url }}</a>
            </div>

            <v-list-item-subtitle class="text-caption text-medium-emphasis mt-1">
              {{ formatDate(item.createdAt) }}
            </v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </div>
    </v-card>
  </v-menu>
</template>

<script setup lang="ts">
// The bell: the user's events, newest first. Events stay until the user deletes them (select rows, delete) or they
// pass the retention (server/cron/truncate_user_events.ts). The badge counts the warnings and errors.
// App config userEvents (app/app.config.ts) leaves categories out and adds summary lines for them.
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { apiGet, apiDelete } from '~/utils/fetch/wrappers'
import EventPanelHeader from './event_panel_header.vue'
import type { EventLevel } from './event_level_filter.vue'

interface UserEventItem {
  id: string
  level: string
  message: string
  category?: string | null
  metadata?: Record<string, any>
  createdAt: string | Date
}

const { t, te } = useI18n()
const router = useRouter()

const settings = computed(() => (useAppConfig() as any).userEvents ?? {})
const excludeCategories = computed<string[]>(() => settings.value.excludeCategories ?? [])

interface Summary { category: string; message: string; to: string; count: number; level: 'error' | 'warn' }
const summaries = ref<Summary[]>([])
const activeSummaries = computed(() => summaries.value.filter(s => s.count > 0))

const events = ref<UserEventItem[]>([])
const loading = ref(false)
const menuOpen = ref(false)
let timer: ReturnType<typeof setInterval> | null = null

// 'warning' is stored by older code; it is the same level as 'warn'
const levelOf = (level?: string): EventLevel => {
  const l = level?.toLowerCase()
  return l === 'error' ? 'error' : (l === 'warn' || l === 'warning') ? 'warn' : 'info'
}

const levels = ref<EventLevel[]>(['info', 'warn', 'error'])
const levelCounts = computed(() => {
  const counts: Record<EventLevel, number> = { info: 0, warn: 0, error: 0 }
  for (const e of events.value) counts[levelOf(e.level)]++
  return counts
})
const shownEvents = computed(() => events.value.filter(e => levels.value.includes(levelOf(e.level))))

// Selection: clicking a row toggles it; select all applies to the shown rows
const selected = ref(new Set<string>())
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
    events.value = events.value.filter(e => !selected.value.has(e.id))
    selected.value = new Set()
    fetchSummaries()
  } catch (err) {
    console.error('Failed to delete user events:', err)
  }
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

const formatMessage = (item: UserEventItem) => {
  if (!item?.message) return ''
  if (te(item.message)) {
    return t(item.message, item.metadata || {})
  }
  return item.message
}

const formatDate = (dateVal: string | Date) => {
  if (!dateVal) return ''
  const d = new Date(dateVal)
  return isNaN(d.getTime()) ? String(dateVal) : d.toLocaleString()
}

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

// The newest 100 events of the categories the bell shows; the level filter works on them
const fetchEvents = async () => {
  try {
    loading.value = true
    const queryParams = new URLSearchParams({ limit: '100', sortBy: 'createdAt', sortDir: 'desc' })
    if (excludeCategories.value.length) queryParams.set('excludeCategory', excludeCategories.value.join(','))

    const res = await apiGet(`/api/user/event/search?${queryParams.toString()}`)
    if (res?.data && Array.isArray(res.data)) {
      events.value = res.data
      // Keep only selections that are still listed
      const ids = new Set(events.value.map(e => e.id))
      selected.value = new Set([...selected.value].filter(id => ids.has(id)))
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

const openSummary = (summary: Summary) => {
  menuOpen.value = false
  router.push(summary.to)
}

const refresh = () => {
  fetchEvents()
  fetchSummaries()
}

// Opening the bell shows the current state
watch(menuOpen, (open) => { if (open) refresh() })

onMounted(() => {
  refresh()
  timer = setInterval(refresh, 60000)
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})
</script>
