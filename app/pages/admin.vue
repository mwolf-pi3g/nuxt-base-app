<template>
  <v-container>
    <v-tabs v-model="tab" color="primary" class="mb-4">
      <v-tab value="core">{{ $t('admin.core', 'Core') }}</v-tab>
      <v-tab value="app">{{ $t('admin.app', 'App') }}</v-tab>
    </v-tabs>

    <v-window v-model="tab">
      <v-window-item value="core">
        <div v-for="section in admin_core" :key="section.name">
          <div v-for="item in section.items" :key="item.name">
            <div class="mb-4">
                <Table v-slot:default v-if="item.type === 'table' && hasPerm(item.permissions)" :meta="item.data" />
                <span v-if="item.type === 'label' && hasPerm(item.permissions)">{{ item.data || item.name }}</span>
            </div>
          </div>
        </div>
      </v-window-item>

      <v-window-item value="app">
        <AdminApp />
      </v-window-item>
    </v-window>

    <!-- An account's API tokens: admins can see and revoke them, not create them -->
    <v-dialog v-model="showTokens" max-width="900">
      <ApiTokens v-if="showTokens && tokensAccount" :path="`/api/admin/account/${tokensAccount.id}/tokens`" />
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">    
import accountsTableMetaFcn from '#ba/schemas/admin/accounts'
import rolesTableMetaFcn from '#ba/schemas/admin/roles'
import notificationsMetaFcn from '#ba/schemas/admin/notifications'
import hasPerm from '#ba/utils/hasPerm'
import AdminApp from '~/components/admin_app.vue'
import ApiTokens from '~/components/api_tokens.vue'
import { apiPost } from '~/utils/fetch/wrappers'

const tab = ref('core')
const i18n = useI18n();
const admin_core = ref<any[]>([]);

const { fetch: refreshSession } = useUserSession();

const showTokens = ref(false)
const tokensAccount = ref<any>(null)
const onShowTokens = (item?: any) => {
  if (!item?.id) return;
  tokensAccount.value = item;
  showTokens.value = true;
}

const onSetIdent = async (item?: any) => {
  if (!item?.id) return;
  await apiPost('/api/admin/ident/set', { id: item.id });
  await refreshSession();
}

onMounted(async () => {
 admin_core.value = [
  {
      "name": 'administration',
      "items": [
          { name:'account', data:await accountsTableMetaFcn(i18n.t, {onSetIdent, onShowTokens}), type:'table', permissions:['account.crud.read'], icon:'mdi-account'},
          { name:'role', data:await rolesTableMetaFcn(i18n.t), type:'table', permissions:['role.crud.read'], icon:'mdi-role'},
          { name: 'notifications', data: notificationsMetaFcn(i18n.t), type: 'table', permissions: ['notification.crud.read'], icon: 'mdi-bell-outline' }
      ],
  }
 ]
});

</script>