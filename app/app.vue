<template>
  <v-app>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </v-app>
</template>

<style>
/* Custom styles if needed */
body {
  margin: 0;
}

/* App shell: the window never scrolls, only the main area does, so the header, the nav drawer and the footer stay in
   place on long pages. The app is exactly as high as the window; v-main scrolls inside its header/footer padding. */
html {
  overflow: hidden;
}

.v-application,
.v-application__wrap {
  height: 100dvh;
  min-height: 0;
}

.v-main {
  height: 100dvh;
  overflow-y: auto;
}
</style>
