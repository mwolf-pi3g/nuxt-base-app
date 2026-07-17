<template>
  <v-container>
    <div v-for="section in admin_ui" :key="section.name">
      <div v-for="item in section.items" :key="item.name">
        <component v-if="item.type === 'component'" :is="item.data" />
        <!-- <Table v-if="item.type === 'table'" :meta="item.data" /> -->
      </div>
      <Table :meta="accountTableMetaFcn(t)" />
    </div>
  </v-container>
</template>

<script setup lang="ts">    
import admin_current_user from '~/components/admin_current_user.vue'
import accountTableMetaFcn from '~/schemas/accounts'
import roleTableMetaFcn from '~/schemas/roles'
// import application from '~/metadata/tables/admin_app'

const { t } = useI18n();

const admin_ui = [
{
    name: 'administration',
    "items":[
        {name:'admin_current_user', data:admin_current_user, type:'component', permission:'account.set', icon:'mdi-account-switch'},
        {name:'account', data:accountTableMetaFcn(t), type:'table', permission:'account', icon:'mdi-account'},
        {name:'role', data:roleTableMetaFcn(t), type:'table', permission:'role', icon:'mdi-role'},
    ],
},
// application
]

async function get_admin_ui() {
}

const { t } = useI18n()
// const admin_app_meta = admin_app(t);
</script>