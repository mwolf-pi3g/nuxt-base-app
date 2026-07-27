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
  </v-container>
</template>

<script setup lang="ts">    
import accountsTableMetaFcn from '#ba/schemas/accounts'
import rolesTableMetaFcn from '#ba/schemas/roles'
import hasPerm from '#ba/util/hasPerm'
import AdminApp from '~/components/admin_app.vue'
import { apiPost } from '~/util/fetch/wrappers'
import type { UserState } from '~/types/user_state'

const tab = ref('core')
const i18n = useI18n();
const admin_core = ref<any[]>([]);

const userState = useState<UserState>('user', () => ({ as_user: '' }))

const onSetIdent = async (item?: any) => {
  if (!item?.id) item = { id: '54665eeb-5ef7-44e2-b8aa-808e4d02e35d', user: 'Bobs User' };
  const id = item.id;
  const name = item.user || 'Unknown User';

  console.log('setting ident to ' + id + ' (' + name + ')')
  if (userState.value) {
    console.log('userState exists')
    userState.value = { ...userState.value, as_user: name }
  }
  await apiPost('/api/admin/ident/set', { id })
}

onMounted(async () => {
 admin_core.value = [
  {
      "name": 'administration',
      "items": [
          {name:'account', data:await accountsTableMetaFcn(i18n.t, {onSetIdent}), type:'table', permissions:['account.crud.read'], icon:'mdi-account'},
          {name:'role', data:await rolesTableMetaFcn(i18n.t), type:'table', permissions:['role.crud.read'], icon:'mdi-role'},
      ],
  }
 ]
});

</script>