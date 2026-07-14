<template>
  <v-snackbar-queue
    v-model="messages"
    location="bottom center"
    rounded="pill"
    closable
  ></v-snackbar-queue>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const { $bus } = useNuxtApp()
const { t } = useI18n()

interface SnackbarMessage {
  text: string
  color: string
  timeout: number
}

const messages = ref<SnackbarMessage[]>([])

const typeMap: Record<string, { color: string, timeout: number }> = {
  info: { color: 'info', timeout: 1000 },
  success: { color: 'success', timeout: 1000 },
  warning: { color: 'warning', timeout: 5000 },
  error: { color: 'error', timeout: 7000 },
  critical: { color: 'error', timeout: 10000 }
}

const handleShow = (payload: any) => {
  let type = 'info';
  let text = payload.message;

  const testI18N = text?.split(" ");
  if (testI18N && testI18N.length === 2 && Object.keys(typeMap).includes(testI18N[0])) {
    type = testI18N[0];
    text = t(testI18N[1]);
  }

  const config = typeMap[type] || typeMap.info
  messages.value.push({
    text,
    color: config!.color,
    timeout: config!.timeout
  })
}

onMounted(() => {
  $bus.on('alert:show', handleShow)
})

onUnmounted(() => {
  $bus.off('alert:show', handleShow)
})
</script>
