<template>
  <div class="fill-height">
    <Header />
    <v-main class="bg-background fill-height">
      <slot />
    </v-main>
    <Footer />
    <Alert />
  </div>
</template>
