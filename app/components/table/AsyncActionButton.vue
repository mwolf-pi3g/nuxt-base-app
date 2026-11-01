<template>
  <v-btn
    type="button"
    icon
    :color="btnColor"
    :variant="btnVariant"
    :loading="state === 'running'"
    :disabled="state === 'running'"
    @click="execute"
  >
    <v-icon>{{ btnIcon }}</v-icon>
    <v-tooltip
      v-if="tooltipText"
      activator="parent"
      location="top"
    >
      {{ tooltipText }}
    </v-tooltip>
  </v-btn>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  label: string;
  icon?: string;
  successLabel?: string;
  action: () => Promise<{ ok: boolean }>;
}>();

const { t, te } = useI18n();

const state = ref<'idle' | 'running' | 'success' | 'error'>('idle');
let timer: ReturnType<typeof setTimeout> | null = null;

const clearTimer = () => {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
};

const execute = async () => {
  if (state.value === 'running') return;

  clearTimer();
  state.value = 'running';

  try {
    const res = await props.action();
    state.value = res?.ok ? 'success' : 'error';
  } catch {
    // details are in the event log (written server-side)
    state.value = 'error';
  } finally {
    if (state.value === 'success' || state.value === 'error') {
      timer = setTimeout(() => {
        state.value = 'idle';
      }, 5000);
    }
  }
};

onBeforeUnmount(() => {
  clearTimer();
});

const btnColor = computed(() => {
  if (state.value === 'success') return 'success';
  if (state.value === 'error') return 'error';
  return undefined;
});

const btnVariant = computed(() => {
  if (state.value === 'success' || state.value === 'error') return 'tonal';
  return 'tonal';
});

const btnIcon = computed(() => {
  if (state.value === 'success') return 'mdi-check';
  if (state.value === 'error') return 'mdi-alert-circle-outline';
  return props.icon || 'mdi-connection';
});

const tooltipText = computed(() => {
  if (state.value === 'running') {
    return te('form.testing') ? t('form.testing') : 'Testing…';
  }
  if (state.value === 'success') {
    return props.successLabel || (te('common.ok') ? t('common.ok') : 'OK');
  }
  if (state.value === 'error') {
    return te('common.failed_see_log') ? t('common.failed_see_log') : 'Failed, see event log';
  }
  return props.label || 'Test connection';
});
</script>
