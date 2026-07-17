<template>
  <v-container>
    <div v-for="section in admin_ui" :key="section.name">
      <div v-for="item in section.items" :key="item.name">
        <div class="mb-4">
            <component v-if="item.type === 'component' && await has_perms(item.permissions)" :is="item.data" />
            <Table v-if="item.type === 'table' && await has_perms(item.permissions)" :meta="item.data" />
        </div>
      </div>
      <!-- <Table :meta="accountTableMetaFcn(t)" /> -->
    </div>
  </v-container>
</template>

<script setup lang="ts">    
import admin_current_user from '~/components/admin_current_user.vue'
import accountTableMetaFcn from '#ba/schemas/accounts'
import roleTableMetaFcn from '#ba/schemas/roles'
import has_perms from '~/util/has_perms'

const i18n = useI18n();

const admin_ui = [
{
    name: 'administration',
    "items":[
        {name:'admin_current_user', data:admin_current_user, type:'component', permissions:['account.set'], icon:'mdi-account-switch'},
        {name:'account', data:accountTableMetaFcn(i18n.t), type:'table', permissions:['account.read'], icon:'mdi-account'},
        {name:'role', data:roleTableMetaFcn(i18n.t), type:'table', permissions:['role.read'], icon:'mdi-role'},
    ],
},
// application
]

async function get_admin_ui() {
}

const { t } = useI18n()
// const admin_app_meta = admin_app(t);
</script>