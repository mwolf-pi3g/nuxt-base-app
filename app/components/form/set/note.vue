<template>
  <div class="mb-3">
    <div v-if="header.title" class="v-label text-caption mb-1">{{ header.title }}</div>
    <div class="text-body-2 note-text" :class="header.opts?.color ? `text-${header.opts.color}` : ''">{{ text }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

// Display-only: shows header.opts.text localized, in header.opts.color (a theme color such as 'primary') if set. Has no value and adds nothing to the submitted data.
const props = defineProps<{
  header: any
}>()

const { t, te } = useI18n()

// opts.text: an i18n key, or [key, args] for a message with parameters; text that isn't a key is shown as is
const text = computed(() => {
  const val = props.header.opts?.text
  if (!val) return ''
  if (Array.isArray(val)) {
    const [key, ...args] = val
    return te(key) ? t(key, ...args) : key
  }
  return te(val) ? t(val) : val
})
</script>

<style scoped>
.note-text {
  white-space: pre-line;
}
</style>
