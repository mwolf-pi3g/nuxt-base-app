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
            <v-btn v-if="hasCreate" icon color="primary" @click="onActionClick({action: 'create', onFormSubmit: onCreate})">
              <v-icon>mdi-plus</v-icon>
            </v-btn>
          </v-toolbar>

          <v-data-table v-model="selected" :headers="tableData" :items="localModel" :show-select="hasAnyMany"
            item-value="id" return-object :hide-default-footer="hasSingular">
            <template v-for="header in tableData" v-slot:[`item.${header.key}`]="{ item }">
              <div v-if="header.key === 'actions'" class="d-flex align-center">
                <v-icon v-for="(a, i) in actions" :key="i" :color="a.color || 'primary'"  variant="plain" 
                  v-tooltip="a.tooltip" @click="onActionClick(a, item)" :icon="a.icon"  class="cursor-pointer, ml-1"/> 
              </div>

              <TableGetString v-else-if="header.get_type === 'string'" :model="item[header.key]" />
              <TableGetEnum v-else-if="header.get_type === 'enum'" :model="item[header.key]", :enum_values="header.enum_values" />
              <TableGetEnumTag v-else-if="header.get_type === 'enum_tag'" :model="item[header.key]"
                :enum-values="header.enum_values" />
              <TableGetListTag v-else-if="header.get_type === 'list_tag'" :model="item[header.key]" :color_delimiter="header.color_delimiter" :enum_values="header.enum_values"/>
              <TableGetBoolean v-else-if="header.get_type === 'boolean'" :model="item[header.key]" />
              <TableGetHidden v-else-if="header.get_type === 'hidden'" />
              <TableGetShortDate v-else-if="header.get_type === 'short_date'" :model="item[header.key]" />
              <TableGetGmailLink v-else-if="header.get_type === 'gmail_link'" :model="item[header.key]" />
              <!-- <span v-else-if="header.key !== 'actions'">{{ item[header.key] }}</span> -->
            </template>
          </v-data-table>
        </v-tabs-window-item>

        <v-tabs-window-item value="form">
          <v-btn class="my-4" icon color="primary" variant="tonal" @click="tab = 'table'">
            <v-icon>mdi-arrow-left</v-icon>
          </v-btn>
          <!-- <FormWrapper class="mt-4" v-if="showForm" :key="editingItem ? editingItem.id : 'new'" :headers="formData"
            :initial-data="editingItem" @submit="(data:any) => onFormSubmit(editingItem?.id, data)" @cancel="onFormCancel" /> -->
          <FormWrapper class="mt-4" v-if="showForm" :headers="formData"
            :initial-data="editingItem" @submit="(data:any) => onFormSubmit(editingItem?.id, data)" @cancel="onFormCancel" />
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
const formSubmitCallback = ref<any>(null)
const action = ref<string>('')
const i18n = useI18n();

const hasSingular = computed(() => props.meta.features?.includes('singular'))
const hasCreate = computed(() => props.meta.features?.includes('create'))
const hasDeleteMany = computed(() => props.meta.features?.includes('deleteMany'))
const hasAnyMany = computed(() => props.meta.features?.some(f => f.endsWith('Many')))


const formData = computed(() => {
  if (!action.value) return props.meta.headers;
  return props.meta.headers?.filter(h => {
    if (h.actions && !h.actions.includes(action.value)) return false;
    else return true;
  })
})

const tableData = computed(() => {
  return props.meta.headers?.filter(h => {
    return h.get_type || h.key === 'actions';
  });
})

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

const onActionClick = (actionSpec, item?: any) => {
  action.value = actionSpec.action // computes form headers, sets callback

  // form setup
  if (actionSpec.onFormSubmit) {
    if (item) {
      editingItem.value = { ...item }
    } else {
      editingItem.value = null
    }

    tab.value = 'form'
    formSubmitCallback.value = actionSpec.onFormSubmit
    showForm.value = true;
  } else { // action callback
    actionSpec.onActionClick(item);
  }
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

const onCreate = async (id: string, data: any) => {
  await apiPost(props.meta.path_base, data)
}

const onUpdate = async (id: string, data: any) => {
  await apiPatch(`${props.meta.path_base}/${id}`, data)
}

const formReset = () => {
  tab.value = 'table'
  showForm.value = false
  editingItem.value = null
  formSubmitCallback.value = null
}

const onFormCancel = () => {
  formReset();
}

const onFormSubmit = async (id: string, data: any) => {
  await formSubmitCallback.value(id, data);
  formReset();
  await loadData();
}

const actions = computed(() => {
  const a = [
    ...(props.meta.customActions || [])
  ]

  if (props.meta.features?.includes('update')) {
    a.push({ icon: 'mdi-pencil', tooltip: i18n.t('form.actions.update'), color:'primary', onFormSubmit: onUpdate, action: 'update'  })
  }

  if (props.meta.features?.includes('delete')) {
    a.push({ icon: 'mdi-delete', tooltip: i18n.t('form.actions.delete'), color:'error', onActionClick: onDelete })
  }

  return a
})

onMounted(async () => {
  localModel.value = props.model;
  if (props.meta.readOnMount && !props.model) {
    localModel.value = await loadData()
  }
})
</script>
