<template>
  <v-container class="d-flex flex-column align-center ga-5 py-8" style="max-width: 900px;">
    <Table :meta="artifactsMeta" class="w-100 mb-6" />

    <!-- View Artifact Modal -->
    <v-dialog v-model="viewDialog" max-width="800" scrollable>
      <v-card v-if="selectedArtifact">
        <v-card-title class="d-flex justify-space-between align-center">
          <span class="text-truncate">{{ selectedArtifact.id }}</span>
          <v-btn icon="mdi-close" variant="text" size="small" @click="viewDialog = false" />
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-4" style="max-height: 60vh;">
          <v-progress-circular v-if="loading" indeterminate color="primary" class="d-block mx-auto my-6" />
          <div v-else-if="isAudio(selectedArtifact)" class="d-flex flex-column align-center justify-center py-6">
            <v-icon icon="mdi-music-note" size="64" color="primary" class="mb-4" />
            <audio controls class="w-100" style="max-width: 500px;" :src="getAudioSrc(selectedArtifact)">
              Your browser does not support the audio element.
            </audio>
          </div>
          <pre v-else class="text-body-2 font-monospace" style="white-space: pre-wrap; word-break: break-word;">{{ selectedArtifact.content }}</pre>
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-3">
          <v-spacer />
          <v-btn variant="text" @click="viewDialog = false">{{ t('form.cancel') }}</v-btn>
          <v-btn color="primary" variant="tonal" prepend-icon="mdi-download" @click="onDownload(selectedArtifact)">
            {{ t('table.artifacts.download') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import artifactsMetaFcn from '~/schemas/artifacts';
import { apiGet } from '~/utils/fetch/wrappers';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const viewDialog = ref(false);
const loading = ref(false);
const selectedArtifact = ref<any>(null);

const isAudio = (artifact: any) => {
  if (!artifact) return false;
  const ext = artifact.extension || artifact.id?.split('.').pop();
  return ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'].includes(ext?.toLowerCase() || '');
};

const getAudioSrc = (artifact: any) => {
  if (!artifact?.id) return '';
  return `/api/user/artifacts/${encodeURIComponent(artifact.id)}?raw=1`;
};

const onView = async (item: any) => {
  if (!item?.id) return;
  const ext = item.extension || item.id.split('.').pop();
  selectedArtifact.value = { id: item.id, extension: ext, content: '' };
  viewDialog.value = true;

  if (isAudio({ id: item.id, extension: ext })) {
    return;
  }

  loading.value = true;
  try {
    const res = await apiGet(`/api/user/artifacts/${encodeURIComponent(item.id)}`);
    if (res?.data) {
      selectedArtifact.value = res.data;
    }
  } catch (err) {
    console.error('Failed to load artifact content:', err);
  } finally {
    loading.value = false;
  }
};

const onDownload = (item: any) => {
  if (item?.id) {
    window.open(`/api/user/artifacts/${encodeURIComponent(item.id)}?download=1`, '_blank');
  }
};

const artifactsMeta = artifactsMetaFcn(t, { onView, onDownload });
</script>
