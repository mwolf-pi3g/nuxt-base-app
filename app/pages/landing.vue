<template>
  <v-container fluid class="pa-0 fill-height">
    <v-row no-gutters class="fill-height">
      <v-col cols="12" md="12" class="d-none d-md-flex align-center justify-center overlay-container">
        <v-img :src="config.image" cover height="100%" width="100%"></v-img>
        <div class="overlay-blue"></div>
        <div class="branding">
            <h1 class="text-h2 font-weight-bold text-white mb-4">{{ config.name }}</h1>
            <p class="text-h6 text-white text-opacity-80">{{ config.subtitle }}</p>
            <v-btn to="/login">Login</v-btn>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import config from '~/metadata/app.json'
</script>

<style scoped>
.overlay-container {
  position: relative;
  height: 85vh;
}

.overlay-blue {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.7), rgba(0, 0, 0, 0.5));
  z-index: 1;
}

.branding {
  position: absolute;
  z-index: 2;
  text-align: center;
  padding: 2rem;
}
</style>

