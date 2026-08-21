<template>
  <v-menu v-model="menuOpen" :close-on-content-click="false" location="bottom end" offset="8">
    <template v-slot:activator="{ props }">
      <v-btn icon v-bind="props" class="mx-1">
        <v-badge
          :model-value="unreadCount > 0"
          :content="unreadCount"
          :color="mostSevereColor"
          location="top end"
          offset-x="3"
          offset-y="3"
        >
          <v-icon>mdi-bell-outline</v-icon>
        </v-badge>
      </v-btn>
    </template>

    <v-card min-width="340" max-width="440" rounded="lg" elevation="6">
      <div class="d-flex align-center justify-space-between px-4 py-2 border-b">
        <div class="d-flex align-center ga-1">
            <v-btn
              icon
              variant="text"
              density="compact"
              size="x-small"
              @click="toggleLevel('info')"
            >
              <v-icon size="small" :color="filterLevels.info ? 'info' : 'black'">
                mdi-information
              </v-icon>
            </v-btn>
            <v-btn
              icon
              variant="text"
              density="compact"
              size="x-small"
              @click="toggleLevel('warn')"
            >
              <v-icon size="small" :color="filterLevels.warn ? 'warning' : 'black'">
                mdi-alert
              </v-icon>
            </v-btn>
            <v-btn
              icon
              variant="text"
              density="compact"
              size="x-small"
              @click="toggleLevel('error')"
            >
              <v-icon size="small" :color="filterLevels.error ? 'error' : 'black'">
                mdi-alert-circle
              </v-icon>
            </v-btn>
          </div>

        <v-btn
          v-if="hasUnreadInFiltered"
          variant="text"
          size="x-small"
          color="primary"
          @click="markAllRead"
        >
          {{ $t('events.mark_all_read') }}
        </v-btn>
      </div>

      <div style="max-height: 380px; overflow-y: auto;">
        <div v-if="loading && events.length === 0" class="text-center py-6">
          <v-progress-circular indeterminate size="24" color="primary" />
        </div>

        <div v-else-if="filteredEvents.length === 0" class="text-center py-6 text-caption text-medium-emphasis">
          {{ $t('events.no_events') }}
        </div>

        <v-list v-else density="compact" class="py-0">
          <v-list-item
            v-for="item in filteredEvents"
            :key="item.id"
            @click="markRead(item)"
            class="py-2 px-4 border-b"
            style="cursor: pointer;"
          >
            <template v-slot:prepend>
              <v-icon :color="getEventColor(item.level)" size="small" class="mr-2">
                {{ getEventIcon(item.level) }}
              </v-icon>
            </template>

            <v-list-item-title :class="{ 'font-weight-bold': !item.read, 'text-medium-emphasis': item.read }">
              {{ formatMessage(item) }}
            </v-list-item-title>

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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { apiGet, apiPost } from '~/util/fetch/wrappers'

interface UserEventItem {
  id: string
  level: string
  message: string
  metadata?: Record<string, any>
  read: number
  createdAt: string | Date
}

const { t, te } = useI18n()

const events = ref<UserEventItem[]>([])
const loading = ref(false)
const menuOpen = ref(false)
let timer: ReturnType<typeof setInterval> | null = null

// Filter level toggles (transient state)
const filterLevels = ref({
  info: true,
  warn: true,
  error: true
})

const toggleLevel = (level: 'info' | 'warn' | 'error') => {
  filterLevels.value[level] = !filterLevels.value[level]
}

// Unread event logic & severity calculation for top bell badge
const unreadEvents = computed(() => {
  return events.value.filter(e => !e.read)
})

const unreadCount = computed(() => unreadEvents.value.length)

const mostSevereColor = computed(() => {
  const unread = unreadEvents.value
  if (unread.some(e => e.level?.toLowerCase() === 'error')) {
    return 'error'
  }
  if (unread.some(e => e.level?.toLowerCase() === 'warn' || e.level?.toLowerCase() === 'warning')) {
    return 'warning'
  }
  return 'info'
})

// Filtered event list based on toggled levels
const filteredEvents = computed(() => {
  return events.value.filter(e => {
    const lvl = e.level?.toLowerCase() || 'info'
    if (lvl === 'error' && !filterLevels.value.error) return false
    if ((lvl === 'warn' || lvl === 'warning') && !filterLevels.value.warn) return false
    if (lvl !== 'error' && lvl !== 'warn' && lvl !== 'warning' && !filterLevels.value.info) return false
    return true
  })
})

const hasUnreadInFiltered = computed(() => {
  return filteredEvents.value.some(e => !e.read)
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
  switch (level?.toLowerCase()) {
    case 'error': return 'mdi-alert-circle'
    case 'warn': return 'mdi-alert'
    default: return 'mdi-information'
  }
}

const getEventColor = (level: string) => {
  switch (level?.toLowerCase()) {
    case 'error': return 'error'
    case 'warn': return 'warning'
    default: return 'info'
  }
}

const fetchEvents = async () => {
  try {
    loading.value = true
    const res = await apiGet('/api/user/event')
    if (res?.data && Array.isArray(res.data)) {
      events.value = res.data
    }
  } catch (err) {
    console.error('Failed to fetch user events:', err)
  } finally {
    loading.value = false
  }
}

const markRead = async (item: UserEventItem) => {
  if (item.read) return
  item.read = 1
  try {
    await apiPost('/api/user/event', { id: item.id })
  } catch (err) {
    console.error(`Failed to mark event ${item.id} as read:`, err)
  }
}

const markAllRead = async () => {
  const unreadItems = filteredEvents.value.filter(e => !e.read)
  if (unreadItems.length === 0) return
  const unreadIds = unreadItems.map(e => e.id)
  unreadItems.forEach(item => { item.read = 1 })
  try {
    await apiPost('/api/user/event', { ids: unreadIds })
  } catch (err) {
    console.error('Failed to mark all events as read:', err)
  }
}

onMounted(() => {
  fetchEvents()
  timer = setInterval(fetchEvents, 60000)
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})
</script>
