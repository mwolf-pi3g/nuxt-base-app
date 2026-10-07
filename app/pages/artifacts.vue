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
          <div v-else-if="isMarkdown(selectedArtifact)" class="markdown-body pa-2" v-html="formattedMarkdown" />
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
import { ref, computed } from 'vue';
import { marked } from 'marked';
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

const isMarkdown = (artifact: any) => {
  if (!artifact) return false;
  const ext = (artifact.extension || artifact.id?.split('.').pop() || '').toLowerCase();
  return ['md', 'markdown', 'txt'].includes(ext);
};

const formattedMarkdown = computed(() => {
  if (!selectedArtifact.value?.content) return '';
  return marked.parse(selectedArtifact.value.content, { async: false, breaks: true }) as string;
});

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

<style scoped>
.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4) {
  margin-top: 1rem;
  margin-bottom: 0.5rem;
  font-weight: 600;
  line-height: 1.3;
}

.markdown-body :deep(h1) {
  font-size: 1.4rem;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  padding-bottom: 0.3rem;
}

.markdown-body :deep(h2) {
  font-size: 1.2rem;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  padding-bottom: 0.2rem;
}

.markdown-body :deep(h3) {
  font-size: 1.05rem;
}

.markdown-body :deep(p) {
  margin-bottom: 0.75rem;
  line-height: 1.6;
}

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  padding-left: 1.5rem;
  margin-bottom: 0.75rem;
}

.markdown-body :deep(li) {
  margin-bottom: 0.25rem;
}

.markdown-body :deep(code) {
  background-color: rgba(var(--v-theme-on-surface), 0.08);
  padding: 0.15em 0.35em;
  border-radius: 4px;
  font-size: 88%;
  font-family: monospace;
}

.markdown-body :deep(pre) {
  background-color: rgba(var(--v-theme-on-surface), 0.06);
  padding: 0.85rem;
  border-radius: 6px;
  overflow-x: auto;
  margin-bottom: 1rem;
}

.markdown-body :deep(pre code) {
  background-color: transparent;
  padding: 0;
  font-size: 0.85rem;
}

.markdown-body :deep(blockquote) {
  padding: 0.5rem 1rem;
  border-left: 4px solid rgb(var(--v-theme-primary));
  background-color: rgba(var(--v-theme-primary), 0.05);
  margin-bottom: 1rem;
  border-radius: 0 4px 4px 0;
}

.markdown-body :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1rem;
}

.markdown-body :deep(th),
.markdown-body :deep(td) {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  padding: 6px 12px;
}

.markdown-body :deep(th) {
  background-color: rgba(var(--v-theme-on-surface), 0.04);
  font-weight: 600;
}

.markdown-body :deep(hr) {
  border: 0;
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  margin: 1rem 0;
}
</style>
