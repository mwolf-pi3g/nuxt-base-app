<template>
  <Table v-if="meta && meta.path_base" ref="tableRef" :meta="meta" />

  <v-dialog v-model="showTokens" max-width="900">
    <ApiTokens v-if="showTokens" path="/api/user/account/tokens" can-create />
  </v-dialog>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import accountMetaFcn from '#ba/schemas/account';
import ApiTokens from '~/components/api_tokens.vue';
import { apiPatch } from '~/utils/fetch/wrappers';

const { t } = useI18n();
const meta = ref<any>(null);
const showTokens = ref(false);

onMounted(async () => {
  meta.value = await accountMetaFcn(t, {
    onSetPassword: async (id: string, data: any) => {
      const res = await apiPatch(`/api/user/account/password/${id}`, data);
      return res;
    },
    onShowTokens: () => { showTokens.value = true; },
  });
});
</script>
