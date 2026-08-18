<template>
    <Table :meta="tableMeta" v-if="tableMeta" />

    <!-- <v-row class="mt-6" v-if="showWhatsapp">
      <v-col cols="12" md="6" lg="5">
        <NotificationChannelsWhatsapp @cancel="showWhatsapp = false" />
      </v-col>
    </v-row> -->
</template>

<script setup lang="ts">
import tableMetaFcn from '#ba/schemas/notification_channels'
import { z } from 'zod'

const { t } = useI18n();
const showWhatsapp = ref(false)

// const onAddWhatsapp = () => {
//   showWhatsapp.value = true
// }

// const onSetDefault = (item: any) => {
// }

const generateZodRules = (token: any) => {
  let schema: z.ZodTypeAny;

  if (token.type === 'bool') {
    schema = z.boolean();
  } else if (token.type === 'choice:int' || token.type === 'int') {
    let numSchema = z.coerce.number();
    if (typeof token.min === 'number') {
      numSchema = numSchema.min(token.min, t('rules.apprise.number.min', { min: token.min }));
    }
    if (typeof token.max === 'number') {
      numSchema = numSchema.max(token.max, t('rules.apprise.number.max', { max: token.max }));
    }
    schema = numSchema;
  } else {
    let strSchema = z.string().trim().min(1, t('rules.apprise.string.min')).max(64, t('rules.apprise.string.max'));
    if (token.regex && Array.isArray(token.regex)) {
      const pattern = token.regex[0];
      const flags = token.regex[1] || '';
      strSchema = strSchema.regex(new RegExp(pattern, flags), t('rules.apprise.string.regex'));
    }
    schema = strSchema;
  }

  return (val: any) => {
    const rv = schema.safeParse(val);
    return rv.success || rv.error?.issues?.[0]?.message || t('rules.apprise.invalid');
  };
}

const schemaCache: Record<string, any> = {};

const getChannelConfigSchema = async (header: any, row: any) => {
  if (!row?.provider || !row?.type) {
    return [];
  }

  const providerLower = row.provider.toLowerCase();
  const cacheKey = `${providerLower}:${row.type}`;
  const { apiGet } = await import('~/util/fetch/wrappers');

  try {
    let res = schemaCache[cacheKey];
    if (!res) {
      res = await apiGet(`/api/user/notification/schema/services/${encodeURIComponent(providerLower)}/${encodeURIComponent(row.type)}`);
      if (res && res.details) {
        schemaCache[cacheKey] = res;
      }
    }
    if (!res || !res.details) {
      return [];
    }

    const templates = res.details.templates || [];
    if (!row[header.key]) {
      row[header.key] = {};
    }
    const configData = row[header.key];

    const trackerKey = `_last_schema_type`;
    const currentSchemaType = `${providerLower}:${row.type}`;
    if (row[trackerKey] !== undefined && row[trackerKey] !== currentSchemaType) {
      for (const k of Object.keys(configData)) {
        delete configData[k];
      }
    }
    row[trackerKey] = currentSchemaType;

    if (!configData.template || !templates.includes(configData.template)) {
      configData.template = templates[0] || '';
    }
    const chosenTemplate = configData.template || templates[0] || '';

    const templateTokens = new Set<string>();
    const matches = chosenTemplate.match(/\{([a-zA-Z0-9_-]+)\}/g);
    if (matches) {
      for (const match of matches) {
        templateTokens.add(match.slice(1, -1));
      }
    }

    const schemaHeaders: any[] = [];

    schemaHeaders.push({
      title: t('form.notification.services.template'),
      key: 'template',
      set_type: 'enum',
      enum_values: templates
    });

    const tokens = res.details.tokens || {};
    for (const [key, token] of Object.entries(tokens) as [string, any][]) {
      if (!templateTokens.has(key)) {
        continue;
      }

      let set_type = '';
      if (token.type === 'bool') {
        set_type = 'boolean';
      } else if (token.type === 'choice:int' || token.type === 'choice:string') {
        set_type = 'enum';
      } else if (token.type === 'int' || token.type === 'list:string' || token.type === 'string') {
        set_type = 'string_line';
      } else {
        continue;
      }

      const item: any = {
        title: t("form.notification.services." + (token.name.toLowerCase())),
        key: key,
        set_type: set_type,
        rules: [generateZodRules(token)]
      };

      if (set_type === 'enum' && token.values) {
        if (token.conditional_field) {
          const parentKey = token.conditional_field;
          item.enum_values = (header: any, formData: any) => {
            const parentVal = formData ? formData[parentKey] : undefined;

            const trackerKey = `_last_${parentKey}_for_${key}`;
            if (formData && formData[trackerKey] !== parentVal) {
              const oldParent = formData[trackerKey];
              formData[trackerKey] = parentVal;
              if (oldParent !== undefined) {
                formData[key] = '';
              }
            }

            if (!parentVal) return [];
            const valuesMap = token.values || {};
            const list = valuesMap[parentVal] || [];
            if (Array.isArray(list)) {
              const options = list.map((val: any) => {
                if (typeof val === 'object' && val !== null) return val;
                return { title: val, value: val };
              });

              if (formData && formData[key]) {
                const exists = options.some((opt: any) => opt.value === formData[key] || opt === formData[key]);
                if (!exists) {
                  formData[key] = '';
                }
              }

              return options;
            }
            return [];
          };
        } else {
          item.enum_values = token.values;
        }
      }

      schemaHeaders.push(item);
    }

    return schemaHeaders;
  } catch (error) {
    console.error('Failed to get channel config schema:', error);
    return [];
  }
}

const tableMeta = ref(null);

onMounted(async () => {
   tableMeta.value = await tableMetaFcn(useI18n().t, {
    // onAddWhatsapp,
    // onSetDefault,
    form:{ getChannelConfigSchema}
  })
})
</script>
