<template>
  <v-footer app border class="text-center d-flex align-center justify-center" v-if="config.show">
    <div>
      &copy; {{ currentYear }} {{ config.company }}. <v-btn variant="text" :href="config.legal_url" target="_blank" rel="noopener noreferrer" class="ml-2">{{ $t('frontend.footer.legal') }}</v-btn>
    </div>
  </v-footer>
</template>

<script setup lang="ts">
import config from '~/metadata/footer.json'
const currentYear = new Date().getFullYear();
</script>
