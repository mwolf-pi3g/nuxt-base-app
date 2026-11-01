<template>
    <Table :meta="tableMeta" v-if="tableMeta" />
</template>

<script setup lang="ts">
import tableMetaFcn from '#ba/schemas/notification_channels'
import { tokenRule, templateKeys } from '#b/shared/rules/notification_channels'

const { t } = useI18n();

// const onSetDefault = (item: any) => {
// }

// Rule of a config field, shared with the server. A field that depends on another (conditional_field) only offers
// the values valid for it, so its dependency is checked by the server alone.
const configRule = (token: any) => {
  const rule = tokenRule(token, undefined, (key, params) => t(key, params || {}));
  return (val: any) => {
    const rv = rule.safeParse(val);
    return rv.success || rv.error.issues[0]?.message || t('table.notification_channels.rules.config.invalid');
  };
}

const schemaCache: Record<string, any> = {};
let servicesCache: Record<string, string[]> | null = null;

const getChannelConfigSchema = async (header: any, row: any) => {
  if (!row?.provider) {
    return [];
  }

  const providerLower = row.provider.toLowerCase();
  const { apiGet } = await import('~/utils/fetch/wrappers');

  if (!servicesCache) {
    try {
      const servicesRes = await apiGet('/api/user/notification/schema/services');
      if (servicesRes && typeof servicesRes === 'object' && !Array.isArray(servicesRes)) {
        servicesCache = {};
        for (const [k, v] of Object.entries(servicesRes)) {
          servicesCache[k.toLowerCase()] = Array.isArray(v) ? v : [];
        }
      }
    } catch (e) {
      console.error('Failed to load notification services cache', e);
    }
  }

  const allowedTypes = servicesCache?.[providerLower];
  if (allowedTypes && allowedTypes.length > 0) {
    if (!row.type || !allowedTypes.includes(row.type)) {
      row.type = allowedTypes[0];
    }
  }

  if (!row?.type) {
    return [];
  }

  const cacheKey = `${providerLower}:${row.type}`;

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

    const templateTokens = new Set<string>(templateKeys(chosenTemplate));

    const schemaHeaders: any[] = [];

    schemaHeaders.push({
      title: t('form.notification.services.template'),
      key: 'template',
      set_type: 'enum',
      opts: { enum_values: templates }
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
        set_type = token.private === true ? 'string_secret' : 'string_line';
      } else {
        continue;
      }

      const item: any = {
        title: t("form.notification.services." + (token.name.toLowerCase())),
        key: key,
        set_type: set_type,
        default: token.default,
        rules: [configRule(token)]
      };

      if (set_type === 'enum' && token.values) {
        if (token.conditional_field) {
          const parentKey = token.conditional_field;
          item.opts = { enum_values: (header: any, formData: any) => {
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
          } };
        } else {
          item.opts = { enum_values: token.values };
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
    // onSetDefault,
    form:{ getChannelConfigSchema}
  })
})
</script>
