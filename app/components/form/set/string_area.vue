<template>
  <v-textarea
    v-model="internalValue"
    :label="header.title"
    :placeholder="header.opts?.placeholder"
    :persistent-placeholder="!!header.opts?.placeholder"
    :rules="rules"
    :counter="header.opts?.max_chars"
    :persistent-counter="!!header.opts?.max_chars"
    variant="outlined"
    density="comfortable"
    :hide-details="header.opts?.max_chars ? false : 'auto'"
    class="mb-3"
    :rows="header.opts?.rows || 3"
    :auto-grow="header.opts?.auto_grow !== false"
  >
    <!-- Optional opts.action: an icon button in the field; its run(value) may return a new value for the field -->
    <template v-if="action" #append-inner>
      <v-btn
        icon
        variant="text"
        size="small"
        density="comfortable"
        :color="action.color || 'primary'"
        :loading="running"
        :title="action.tooltip"
        @click.stop="runAction"
      >
        <v-icon>{{ action.icon }}</v-icon>
      </v-btn>
    </template>
  </v-textarea>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const props = defineProps<{
  modelValue: any
  header: any
  rules?: any[]
}>()

const emit = defineEmits(['update:modelValue'])

const internalValue = computed({
  get: () => {
    if (props.modelValue !== undefined) return props.modelValue
    return props.header.default !== undefined ? props.header.default : ''
  },
  set: (val) => emit('update:modelValue', val)
})

const action = computed(() => props.header.opts?.action as
  { icon: string; tooltip?: string; color?: string; run: (value: string) => Promise<string | void> } | undefined)
const running = ref(false)

const runAction = async () => {
  if (!action.value || running.value) return
  running.value = true
  try {
    const next = await action.value.run(internalValue.value ?? '')
    if (typeof next === 'string') internalValue.value = next
  } catch (err) {
    console.error('Field action failed:', err)
  } finally {
    running.value = false
  }
}

onMounted(() => {
  if (props.modelValue === undefined) {
    emit('update:modelValue', internalValue.value)
  }
})
</script>
