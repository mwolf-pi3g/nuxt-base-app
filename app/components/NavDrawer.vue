<template>
  <v-navigation-drawer
    v-if="loggedIn"
    permanent
    :rail="!isPinned"
    :expand-on-hover="!isPinned"
    class="app-nav-drawer"
    width="240"
    rail-width="64"
  >
    <!-- Top: Username + Toggleable Pin + HR -->
    <div class="pa-3 pb-0 nav-header-container">
      <div class="d-flex align-center justify-space-between user-header px-1">
        <span class="text-subtitle-2 font-weight-bold text-truncate user-display-name mr-2" :title="displayName">
          {{ displayName }}
        </span>
        <v-btn
          icon
          size="x-small"
          variant="text"
          :color="isPinned ? 'primary' : 'medium-emphasis'"
          v-tooltip="pinTooltip"
          class="nav-pin-btn"
          @click.stop="isPinned = !isPinned"
        >
          <v-icon size="18">{{ isPinned ? 'mdi-pin-outline' : 'mdi-pin-off-outline' }}</v-icon>
        </v-btn>
      </div>
      <hr class="mt-2 nav-divider" />
    </div>

    <!-- Navigation List (Sections & Items) -->
    <v-list density="compact" nav class="px-2 py-2">
      <template v-for="page in navConf.pages" :key="page.name">
        <!-- Section with Children -->
        <template v-if="page.children && page.children.length > 0">
          <template v-if="hasVisibleChildren(page)">
            <v-list-subheader class="nav-section-title text-primary font-weight-bold text-uppercase text-caption letter-spacing-1 mt-2 mb-1 px-3">
              <span>{{ $t('pages.' + page.name) || page.name }}</span>
            </v-list-subheader>

            <template v-for="child in page.children" :key="child.path">
              <v-list-item
                v-if="!child.permissions || hasPerm(child.permissions)"
                :prepend-icon="child.icon"
                :title="$t('pages.' + child.name) || child.name"
                :value="child.path"
                :active="route.path === child.path"
                rounded="lg"
                class="mb-1 nav-item"
                @click="router.push(child.path)"
              />
            </template>
          </template>
        </template>

        <!-- Direct Page (No Children) -->
        <template v-else>
          <v-list-item
            v-if="!page.permissions || hasPerm(page.permissions)"
            :prepend-icon="page.icon"
            :title="$t('pages.' + page.name) || page.name"
            :value="page.path"
            :active="route.path === page.path"
            rounded="lg"
            class="mb-1 nav-item"
            @click="router.push(page.path)"
          />
        </template>
      </template>
    </v-list>

    <!-- Bottom Actions: Info (/howto), Theme Toggle, Logout -->
    <template #append>
      <div class="pa-2 nav-footer-container">
        <hr class="mb-2 nav-divider" />
        <div class="d-flex align-center justify-space-around py-1 nav-actions-row">
          <!-- Info Button -> /howto -->
          <v-btn
            icon
            size="small"
            variant="text"
            v-tooltip="howtoTooltip"
            @click="router.push('/howto')"
          >
            <v-icon size="20">mdi-information-outline</v-icon>
          </v-btn>

          <!-- Theme Toggle -->
          <v-btn
            icon
            size="small"
            variant="text"
            v-tooltip="themeTooltip"
            @click="toggleTheme"
          >
            <v-icon size="20">
              {{ theme.global.current.value.dark ? 'mdi-weather-sunny' : 'mdi-weather-night' }}
            </v-icon>
          </v-btn>

          <!-- Logout Button -->
          <v-btn
            icon
            size="small"
            variant="text"
            color="error"
            v-tooltip="logoutTooltip"
            @click="handleLogout"
          >
            <v-icon size="20">mdi-logout</v-icon>
          </v-btn>
        </div>
      </div>
    </template>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import defaultNavConf from '~/metadata/app_nav.json';
import { apiPost } from '~/utils/fetch/wrappers';
import type { UserState } from '~/types/user_state';
import hasPerm from '~/utils/hasPerm';

const navConf = defaultNavConf;
const { t } = useI18n();

// Default state is unpinned (false) allowing side to collapse
const isPinned = useState<boolean>('nav_drawer_pinned', () => false);

const userState = useState<UserState>('user');
const { loggedIn, user, clear } = useUserSession();
const router = useRouter();
const route = useRoute();
const theme = useTheme();

const displayName = computed(() => {
  return userState.value?.as_user || (user.value as any)?.user || (user.value as any)?.username || (user.value as any)?.email || '';
});

const pinTooltip = computed(() => {
  return isPinned.value ? (t('common.unpin') || 'Unpin Drawer') : (t('common.pin') || 'Pin Drawer');
});

const howtoTooltip = computed(() => {
  return t('common.howto') || 'How To';
});

const themeTooltip = computed(() => {
  return t('common.toggle_theme') || 'Toggle Theme';
});

const logoutTooltip = computed(() => {
  return t('common.logout') || 'Logout';
});

const hasVisibleChildren = (page: any) => {
  if (!page.children) return false;
  return page.children.some((child: any) => !child.permissions || hasPerm(child.permissions));
};

const toggleTheme = () => {
  const setTheme = theme.global.current.value.dark ? 'light' : 'dark';
  theme.global.name.value = setTheme;
};

const handleLogout = async () => {
  try {
    await apiPost('/api/auth/logout', {});
  } catch (err) {
    // API failure handled by global notifier
  }
  await clear();
  router.push('/landing');
};
</script>

<style scoped>
.app-nav-drawer {
  border-right: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  transition: width 0.35s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

.user-header {
  min-height: 32px;
}

.user-display-name {
  white-space: nowrap;
}

.nav-pin-btn {
  transition: all 0.25s ease;
}

.nav-header-container {
  opacity: 1;
  transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.nav-footer-container {
  opacity: 1;
  transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.nav-section-title {
  opacity: 1;
  transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
  overflow: hidden;
}

/* When drawer is in rail mode (collapsed) and not hovered, smoothly ease top, bottom, and section titles to transparent */
.app-nav-drawer.v-navigation-drawer--rail:not(:hover) .nav-header-container,
.app-nav-drawer.v-navigation-drawer--rail:not(.v-navigation-drawer--is-hovering) .nav-header-container {
  opacity: 0 !important;
  pointer-events: none;
}

.app-nav-drawer.v-navigation-drawer--rail:not(:hover) .nav-footer-container,
.app-nav-drawer.v-navigation-drawer--rail:not(.v-navigation-drawer--is-hovering) .nav-footer-container {
  opacity: 0 !important;
  pointer-events: none;
}

.app-nav-drawer.v-navigation-drawer--rail:not(:hover) .nav-section-title,
.app-nav-drawer.v-navigation-drawer--rail:not(.v-navigation-drawer--is-hovering) .nav-section-title {
  opacity: 0 !important;
  pointer-events: none;
}

.nav-divider {
  border: 0;
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.12);
}

.letter-spacing-1 {
  letter-spacing: 0.08em;
}
</style>