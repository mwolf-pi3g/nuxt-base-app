<template>
  <span>{{ model }}</span>
</template>

<script setup lang="ts">
defineProps<{
  model: string
}>()
</script>
