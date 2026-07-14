<template>
  <v-btn
    v-if="model"
    variant="text"
    density="compact"
    color="primary"
    :href="`https://mail.google.com/mail/u/0/#search/rfc822msgid:${encodeURIComponent(model)}`"
    target="_blank"
    class="text-none px-1"
  >
    <v-tooltip :text="model">
      <template #activator="{ props }">
        <v-icon v-bind="props">
          mdi-gmail
        </v-icon>
      </template>
    </v-tooltip>
  </v-btn>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  model: string
}>()

const shortId = computed(() => {
  if (!props.model) return ''
  // Return a truncated version or just "Link"
  return props.model.length > 15 ? props.model.substring(0, 7) + '...' : props.model
})
</script>
