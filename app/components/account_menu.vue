<template>
        <v-list-item @click="router.push('/nowhere')" link>
            <v-list-item-title class="text-primary">{{ t('frontend.nav.go_nowhere_example') }}</v-list-item-title>
        </v-list-item>
</template>

<script setup lang="ts">
const { t } = useI18n()
const router = useRouter()
</script>