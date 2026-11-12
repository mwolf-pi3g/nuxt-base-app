// Live updates: one EventSource per tab (/api/user/stream), shared by every component that subscribes. Messages are
// event names only; a subscriber reloads what it shows through its own routes. No polling: while the stream is down
// the page keeps what it loaded and the stream keeps reconnecting; every (re)connect reloads every subscriber.
import { onMounted, onUnmounted, readonly, ref } from 'vue'

export type UserStreamState = 'open' | 'connecting' | 'down'

const STREAM_URL = '/api/user/stream'
const RETRY_MS = 5_000                  // after a refused connection (the browser only retries dropped ones itself)
const DOWN_AFTER = 3                    // failed attempts in a row before the state is 'down'
const HIDDEN_CLOSE_MS = 5 * 60_000      // a tab hidden this long closes its stream; shown again, it reopens and reloads
const DEBOUNCE_MS = 300                 // names arriving together reload a subscriber once

interface Subscriber {
  names: Set<string>
  reload: () => void
  timer: ReturnType<typeof setTimeout> | null
}

const subscribers = new Set<Subscriber>()
const state = ref<UserStreamState>('connecting')
let source: EventSource | null = null
let failures = 0
let retryTimer: ReturnType<typeof setTimeout> | null = null
let hiddenTimer: ReturnType<typeof setTimeout> | null = null
let closedWhileHidden = false
let visibilityHooked = false

const schedule = (sub: Subscriber) => {
  if (sub.timer) clearTimeout(sub.timer)
  sub.timer = setTimeout(() => {
    sub.timer = null
    try { sub.reload() } catch (err) { console.error('Live update reload failed', err) }
  }, DEBOUNCE_MS)
}

const close = () => {
  if (retryTimer) { clearTimeout(retryTimer); retryTimer = null }
  source?.close()
  source = null
}

const failed = () => {
  failures++
  if (failures >= DOWN_AFTER) state.value = 'down'
  else if (state.value !== 'down') state.value = 'connecting'
}

const open = () => {
  if (source || import.meta.server || subscribers.size === 0) return
  if (typeof EventSource === 'undefined') { state.value = 'down'; return }
  closedWhileHidden = false
  const es = new EventSource(STREAM_URL)
  source = es
  es.onopen = () => {
    failures = 0
    state.value = 'open'
    // Whatever happened while it wasn't open is unknown: everyone reloads
    for (const sub of subscribers) schedule(sub)
  }
  es.onmessage = (msg) => {
    for (const sub of subscribers) if (sub.names.has(msg.data)) schedule(sub)
  }
  es.onerror = () => {
    failed()
    // A dropped connection is retried by the browser (retry: 5000); a refused one (401, 5xx) is closed for good
    if (es.readyState === EventSource.CLOSED && source === es) {
      source = null
      retryTimer = setTimeout(() => { retryTimer = null; open() }, RETRY_MS)
    }
  }
}

const hookVisibility = () => {
  if (visibilityHooked || typeof document === 'undefined') return
  visibilityHooked = true
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      hiddenTimer ??= setTimeout(() => {
        hiddenTimer = null
        if (source || retryTimer) { close(); closedWhileHidden = true }     // on purpose: the state doesn't turn 'down'
      }, HIDDEN_CLOSE_MS)
    } else {
      if (hiddenTimer) { clearTimeout(hiddenTimer); hiddenTimer = null }
      if (closedWhileHidden) open()                                        // its onopen reloads every subscriber
    }
  })
}

/**
 * Calls `reload` when one of `names` arrives, and after every (re)connect of the stream. Subscribes on mount and
 * unsubscribes on unmount; the stream is open while anyone subscribes.
 */
export const useUserStream = (names: string[], reload: () => void) => {
  const sub: Subscriber = { names: new Set(names), reload, timer: null }
  onMounted(() => {
    subscribers.add(sub)
    hookVisibility()
    if (!document.hidden || !closedWhileHidden) open()
  })
  onUnmounted(() => {
    if (sub.timer) clearTimeout(sub.timer)
    subscribers.delete(sub)
    if (subscribers.size === 0) { close(); state.value = 'connecting'; failures = 0 }
  })
}

/** The stream's state for the UI: 'down' after 3 failed attempts in a row (the bell shows it). */
export const useUserStreamState = () => readonly(state)
