<template>
  <v-card class="pa-4 w-100">
    <v-card-text>
      <v-tabs-window v-model="tab">
        <v-tabs-window-item value="table">
          <v-toolbar flat color="transparent">
            <div class="font-weight-bold text-headline-medium text-primary">
              {{ meta.title }}
            </div>  
            <div v-show="selected.length > 1 && hasDeleteMany" class="ms-1">
              <v-btn icon color="error" variant="text" @click="onDeleteMany">
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </div>

            <v-spacer></v-spacer>
            <v-btn v-for="(btn, i) in meta.customAdd" :key="i" icon :color="btn.color || 'primary'"
              :title="btn.tooltip" @click="btn.onClick">
              <v-icon>{{ btn.icon }}</v-icon>
            </v-btn>
            <v-btn v-if="hasCreate" icon color="primary" @click="onAdd">
              <v-icon>mdi-plus</v-icon>
            </v-btn>
          </v-toolbar>

          <v-data-table v-model="selected" :headers="meta.headers" :items="localModel" :show-select="hasAnyMany"
            item-value="id" return-object>
            <template v-for="header in meta.headers" v-slot:[`item.${header.key}`]="{ item }">
              <div v-if="header.key === 'actions'" class="d-flex align-center justify-end">
                <v-btn v-for="(btn, i) in meta.customActions" :key="i" :color="btn.color || 'primary'" icon variant="plain"
                  :title="btn.tooltip" @click="btn.onClick(item)">
                  <v-icon>{{ btn.icon }}</v-icon>
                </v-btn>
                <v-icon v-if="hasUpdate" class="me-2 cursor-pointer" color="primary"
                  @click="onEdit(item)">mdi-pencil</v-icon>
                <v-icon v-if="hasDelete" class="cursor-pointer" color="error"
                  @click="onDelete(item)">mdi-delete</v-icon>
              </div>

              <TableGetString v-else-if="header.get_type === 'string'" :model="item[header.key]" />
              <TableGetEnum v-else-if="header.get_type === 'enum'" :model="item[header.key]" />
              <TableGetEnumTag v-else-if="header.get_type === 'enum_tag'" :model="item[header.key]"
                :enum-values="header.enum_values" />
              <TableGetShortDate v-else-if="header.get_type === 'short_date'" :model="item[header.key]" />
              <TableGetGmailLink v-else-if="header.get_type === 'gmail_link'" :model="item[header.key]" />
              <span v-else-if="header.key !== 'actions'">{{ item[header.key] }}</span>
            </template>
          </v-data-table>
        </v-tabs-window-item>

        <v-tabs-window-item value="form">
          <v-btn class="my-4" icon color="primary" variant="tonal" @click="tab = 'table'">
            <v-icon>mdi-arrow-left</v-icon>
          </v-btn>
          <FormWrapper class="mt-4" v-if="showForm" :key="editingItem ? editingItem.id : 'new'" :headers="meta.headers"
            :initial-data="editingItem" @submit="onFormSubmit" @cancel="onFormCancel" />
        </v-tabs-window-item>
      </v-tabs-window>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import FormWrapper from '~/components/form/form.vue'
import { ref, computed, onMounted } from 'vue'
import { apiGet, apiDelete, apiPost, apiPatch } from '~/util/fetch/wrappers'

const props = defineProps<{
  meta: {
    title: string;
    path_base: string;
    headers: any[];
    features: string[];
    readOnMount: boolean;
    read_options?: string;
    customAdd?: any[];
    customActions?: any[];
  };
  model?: any[];
}>()

const tab = ref('table')
const localModel = ref(props.model);
const selected = ref<any[]>([])
const showForm = ref(false)
const editingItem = ref<any>(null)

const hasCreate = computed(() => props.meta.features?.includes('create'))
const hasUpdate = computed(() => props.meta.features?.includes('update'))
const hasDelete = computed(() => props.meta.features?.includes('delete'))
const hasDeleteMany = computed(() => props.meta.features?.includes('deleteMany'))
const hasAnyMany = computed(() => props.meta.features?.some(f => f.endsWith('Many')))

const loadData = async () => {
  if (!props.meta.path_base) return
  let url = props.meta.path_base
  if (props.meta.read_options) {
    url += (url.includes('?') ? '&' : '?') + 'options=' + props.meta.read_options;
  }
  const res = await apiGet(url)
  const data = Array.isArray(res) ? res : (res?.data || [])
  localModel.value = data
  return data
}

const onDelete = async (item: any) => {
  if (!confirm('Are you sure you want to delete this item?')) return
  try {
    await apiDelete(`${props.meta.path_base}/${item.id}`)
    await loadData()
  } catch (e) {
    console.error(e)
  }
}

const onDeleteMany = async () => {
  if (!confirm(`Are you sure you want to delete ${selected.value.length} items?`)) return
  try {
    await Promise.all(selected.value.map(item => apiDelete(`${props.meta.path_base}/${item.id}`)))
    selected.value = []
    await loadData()
  } catch (e) {
    console.error(e)
  }
}

const onAdd = () => {
  tab.value = 'form'
  editingItem.value = null
  showForm.value = true
}

const onEdit = (item: any) => {
  tab.value = 'form'
  editingItem.value = { ...item }
  showForm.value = true
}

const onFormCancel = () => {
  tab.value = 'table'
  showForm.value = false
  editingItem.value = null
}

const onFormSubmit = async (data: any) => {
  try {
    if (editingItem.value) {
      await apiPatch(`${props.meta.path_base}/${editingItem.value.id}`, data)
    } else {
      await apiPost(props.meta.path_base, data)
    }
    tab.value = 'table'
    showForm.value = false
    editingItem.value = null
    await loadData()
  } catch (e) {
    console.error(e)
  }
}

onMounted(async () => {
  if (props.meta.readOnMount && !props.model) {
    localModel.value = await loadData()
  }
})
</script>
