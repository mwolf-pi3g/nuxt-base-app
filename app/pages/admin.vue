<template>
  <v-container>
    <component :is="admin_ui[0]!.items[0].name" />

    <div v-for="item in admin_ui[0]!.items" :key="item.name">
      <component v-if="item.type === 'component'" :is="item.name" />
      
    </div>
  </v-container>
</template>

<script setup lang="ts">    
// import application from '~/metadata/tables/admin_app'

const admin_ui = [
{
    name: 'administration',
    "items":[
        {name:'admin_current_user', type:'component', permission:'account.set', icon:'mdi-account-switch'},
        {name:'account', type:'table', permission:'account', icon:'mdi-account'},
        {name:'role', type:'table', permission:'role', icon:'mdi-role'},
        {name:'user', type:'table', permission:'user', icon:'mdi-user'}
    ],
},
// application
]

async function get_admin_ui() {
}

const { t } = useI18n()
// const admin_app_meta = admin_app(t);
</script>