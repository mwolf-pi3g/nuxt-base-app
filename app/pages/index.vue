<template>
  <v-container>
    <p> This is the index page.  Add your app here.</p>
    <p> This is a table of fake data. </p>
    <Table :meta="fake_data_meta" />
  </v-container>
</template>

<script setup lang="ts">    
import fake_data from '~/metadata/tables/fake_data'

const { t } = useI18n()
const fake_data_meta = fake_data(t);
</script>
