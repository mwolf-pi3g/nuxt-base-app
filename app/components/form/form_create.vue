<template>
  <component :is="noCard ? 'div' : 'v-card'" :class="noCard ? '' : 'pa-4 w-100'" :variant="noCard ? undefined : 'outlined'">
    <v-card-title v-if="!noCard && meta?.title" class="font-weight-bold text-headline-medium text-primary px-0 mb-2">
      {{ translateTitle(meta.title) }}
    </v-card-title>
    <FormWrapper
      ref="formWrapperRef"
      :headers="formData"
      :initial-data="initialData"
      :cancel-btn="cancelBtn"
      :loading="loading"
      :no-card="true"
      @submit="onSubmit"
      @cancel="('cancel')"
      @valid="(v: boolean) => ('valid', v)"
    />
  </component>
</template>

<script setup lang="ts">
import FormWrapper from '~/components/form/form.vue'
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { apiPost } from '~/utils/fetch/wrappers'
import type { Component } from 'vue'

const props = withDefaults(defineProps<{
  meta: {
    title?: string | [string, ...any[]]
    path_base: string
    headers: any[]
  }
  initialData?: any
  cancelBtn?: boolean
  noCard?: boolean
}>(), {
  cancelBtn: true,
  noCard: false
})

const emit = defineEmits(['created', 'submit', 'cancel', 'valid'])
const { t, te } = useI18n()

const formWrapperRef = ref<any>(null)
const loading = ref(false)

const translateTitle = (val?: string | [string, ...any[]]) => {
  if (!val) return ''
  if (Array.isArray(val)) {
    const [key, ...args] = val
    return te(key) ? t(key, ...args) : key
  }
  return typeof val === 'string' && te(val) ? t(val) : val
}

const formData = computed(() => {
  if (!props.meta?.headers) return []
  const headers = props.meta.headers.filter(h => !h.actions || h.actions.includes('create'))
  return headers.map(h => ({
    ...h,
    title: translateTitle(h.title)
  }))
})

const register = (type: string, component: Component) => {
  if (formWrapperRef.value?.register) {
    formWrapperRef.value.register(type, component)
  }
}

const onSubmit = async (payload: any) => {
  loading.value = true
  try {
    const res = await apiPost(props.meta.path_base, payload)
    emit('created', res)
    emit('submit', res)
    return res
  } finally {
    loading.value = false
  }
}

defineExpose({
  register,
  formWrapperRef,
  submit: onSubmit
})
</script>
