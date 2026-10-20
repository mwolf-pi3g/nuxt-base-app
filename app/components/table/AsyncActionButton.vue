<template>
  <v-btn
    type="button"
    :color="btnColor"
    :variant="btnVariant"
    :loading="state === 'running'"
    :disabled="state === 'running'"
    :prepend-icon="btnIcon"
    class="text-none"
    @click="execute"
  >
    <span class="text-truncate" style="max-width: 250px;">{{ btnText }}</span>
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
  action: () => Promise<{ ok: boolean; message?: string }>;
}>();

const { t, te } = useI18n();

const state = ref<'idle' | 'running' | 'success' | 'error'>('idle');
const message = ref<string>('');
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
  message.value = '';

  try {
    const res = await props.action();
    if (res && res.ok) {
      state.value = 'success';
      message.value = res.message || '';
    } else {
      state.value = 'error';
      message.value = res?.message || 'Error';
    }
  } catch (err: any) {
    state.value = 'error';
    const raw = err?.data?.statusMessage || err?.data?.message || err?.message || 'Error';
    message.value = typeof raw === 'string' && te(raw) ? t(raw) : String(raw);
  } finally {
    if (state.value === 'success' || state.value === 'error') {
      timer = setTimeout(() => {
        state.value = 'idle';
        message.value = '';
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
  if (state.value === 'running') return undefined;
  if (state.value === 'success') return 'mdi-check';
  if (state.value === 'error') return 'mdi-alert-circle';
  return props.icon;
});

const btnText = computed(() => {
  if (state.value === 'running') {
    return te('form.testing') ? t('form.testing') : 'Testing…';
  }
  if (state.value === 'success') {
    return message.value || props.label;
  }
  if (state.value === 'error') {
    return message.value || 'Error';
  }
  return props.label;
});

const tooltipText = computed(() => {
  if (state.value === 'error' || state.value === 'success') {
    return message.value || undefined;
  }
  return undefined;
});
</script>
