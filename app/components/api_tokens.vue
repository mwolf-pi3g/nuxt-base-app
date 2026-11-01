<template>
  <div>
    <Table :key="path" :meta="meta" />

    <!-- A new token is shown once: only its hash is stored -->
    <v-dialog v-model="showToken" max-width="640" persistent>
      <v-card>
        <v-card-title>{{ $t('table.api_tokens.created_title') }}</v-card-title>
        <v-card-text>
          <p class="mb-3 text-primary">{{ $t('table.api_tokens.created_once') }}</p>
          <v-text-field :model-value="newToken" readonly variant="outlined" density="comfortable" hide-details
            class="font-monospace" append-inner-icon="mdi-content-copy" @click:append-inner="copy" />
          <p v-if="copied" class="mt-2 text-success">{{ $t('table.api_tokens.copied') }}</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" @click="close">{{ $t('common.close') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import apiTokensMetaFcn from '#ba/schemas/api_tokens';

const props = defineProps<{
  path: string;          // /api/user/account/tokens or /api/admin/account/<id>/tokens
  canCreate?: boolean;
}>();

const { t } = useI18n();
const newToken = ref('');
const showToken = ref(false);
const copied = ref(false);

const meta = computed(() => apiTokensMetaFcn(t, {
  path: props.path,
  canCreate: props.canCreate,
  onCreated: (res: any) => {
    newToken.value = res?.data?.token || '';
    copied.value = false;
    showToken.value = !!newToken.value;
  },
}));

const copy = async () => {
  try {
    await navigator.clipboard.writeText(newToken.value);
    copied.value = true;
  } catch (e) {
    console.error('Copy failed:', e);
  }
};

const close = () => {
  showToken.value = false;
  newToken.value = '';
};
</script>
