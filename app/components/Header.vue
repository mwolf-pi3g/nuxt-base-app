<template>
  <v-app-bar flat border>
    <div @click="router.push('/')" style="cursor: pointer;" class="d-flex align-center">
      <v-avatar v-if="app_conf.icon && app_conf.icon.startsWith('/')" class="mx-3" size="36" rounded="0" :class="{ 'icon-breathing': activeRequests > 0 }">
        <v-img :src="app_conf.icon"></v-img>
      </v-avatar>
      <v-app-bar-nav-icon v-else :icon="app_conf.icon" :class="{ 'icon-breathing': activeRequests > 0 }"></v-app-bar-nav-icon>
      <v-app-bar-title>
        <b>{{ app_conf.name }}</b>
      </v-app-bar-title>
    </div>

    <div v-if="currentPage" class="d-flex align-center">
      <span class="text-black font-weight-bold mx-2">&gt;</span>
      <span class="text-primary font-weight-bold">{{ $t('pages.' + currentPage) }}</span>
    </div>

    <v-spacer />
    <span v-if="hasPerm('ui:admin') && user" class="font-weight-bold" style="color: red;">
      {{ userState?.as_user || user.user }}
    </span>
    <v-spacer />

    <!-- Language Selector -->
    <v-menu v-if="nav_conf.locales_show !== false">
      <template v-slot:activator="{ props }">
        <v-btn icon v-bind="props">
          <v-icon>mdi-translate</v-icon>
        </v-btn>
      </template>
      <v-list>
        <v-list-item v-for="l in locales" :key="l.code" @click="setLocale(l.code)">
          <v-list-item-title>{{ l.name }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>

    <!-- User Events Bell -->
    <div v-if="loggedIn" class="mr-4 d-flex align-center">
      <UserEvents />
    </div>
  </v-app-bar>
</template>

<script setup lang="ts">
import app_conf from '~/metadata/app.json';
import nav_conf from '~/metadata/app_nav.json';
import type { UserState } from '~/types/user_state';
import hasPerm from '~/util/hasPerm';
import { computed, ref, onMounted, onUnmounted } from 'vue';

const { $bus } = useNuxtApp();
const activeRequests = ref(0);

const onLoadingStart = () => {
  activeRequests.value++;
};
const onLoadingStop = () => {
  activeRequests.value = Math.max(0, activeRequests.value - 1);
};

onMounted(() => {
  $bus.on('loading:start', onLoadingStart);
  $bus.on('loading:stop', onLoadingStop);
});

onUnmounted(() => {
  $bus.off('loading:start', onLoadingStart);
  $bus.off('loading:stop', onLoadingStop);
});

const userState = useState<UserState>('user');
const route = useRoute();
const router = useRouter();
const { setLocale, locales } = useI18n();
const { loggedIn, user } = useUserSession();

const currentPage = computed(() => {
  if (route.path === '/dashboard') return 'dashboard';
  for (const page of nav_conf.pages) {
    if (page.path === route.path) return page.name;
    if (page.children) {
      const child = page.children.find((c: any) => c.path === route.path);
      if (child) return child.name;
    }
  }
  return '';
});
</script>

<style scoped>
.icon-breathing {
  animation: breathe 1.2s ease-in-out infinite;
}

@keyframes breathe {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.4;
    transform: scale(0.92);
  }
}
</style>