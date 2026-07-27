<template>
  <Table v-if="meta && meta.path_base" ref="tableRef" :meta="meta" />
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import accountMetaFcn from '#ba/schemas/account';
import { apiPatch } from '~/util/fetch/wrappers';

const { t } = useI18n();
const meta = ref<any>(null);

onMounted(async () => {
  meta.value = await accountMetaFcn(t, {
    onSetPassword: async (id: string, data: any) => {
      const res = await apiPatch(`/api/user/account/password/${id}`, data);
      return res;
    }
  });
});
</script>
