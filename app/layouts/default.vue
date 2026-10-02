<template>
  <div class="fill-height">
    <Header />
    <NavDrawer />
    <v-main class="bg-background fill-height">
      <slot />
    </v-main>
    <Footer />
    <Alert />
  </div>
</template>
