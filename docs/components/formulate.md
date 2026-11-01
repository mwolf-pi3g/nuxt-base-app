# Schema-Driven Form Components Documentation

The base layer provides two primary form components for managing schema-driven data input:
1. **`FormWrapper` (`app/components/form/form.vue`)**: The core schema-driven form rendering engine.
2. **`FormCreate` (`app/components/form/form_create.vue`)**: A standalone creation container that wraps `FormWrapper` and handles `POST [path_base]` API submission automatically.

---

## 1. Core Form Engine: `FormWrapper` (`form.vue`)

The `FormWrapper` component dynamically builds forms using Vuetify 3 inputs based on the `set_type` specified in your header schemas.

### Component Interface (Props & Emits)

```typescript
// Props
defineProps<{
  headers: SchemaHeader[]; // Field configurations containing set_type and validation rules
  initialData?: any;       // Initial data object for seeding values (edit mode)
  cancelBtn?: boolean;     // Show cancel button (defaults to true)
  loading?: boolean;       // Display loading state on submit button
  noCard?: boolean;        // Render inside a plain <div> instead of a <v-card>
  noSubmit?: boolean;      // Hide default submit/cancel button row
}>()

// Emits
defineEmits<{
  (e: 'submit', data: any): void; // Emitted with sanitized payload when form is submitted
  (e: 'cancel'): void;            // Emitted when cancel button is clicked
  (e: 'valid', isValid: boolean): void; // Emitted whenever form validation state changes
}>()
```

### Custom Component Registry (`customRegistry`)
You can register custom field types dynamically on `FormWrapper` using `register(type, component)`:

```typescript
const formRef = ref();
formRef.value.register('custom_picker', MyCustomPickerComponent);
```

---

## 2. Standalone Creation Component: `FormCreate` (`form_create.vue`)

`FormCreate` is a turnkey component for standalone creation views (e.g. in dashboard split panels, dialogs, or dedicated creation views) that eliminates duplicate API submission boilerplate.

### Component Interface

```typescript
defineProps<{
  meta: {
    title?: string | [string, ...any[]]; // Form title displayed on card
    path_base: string;                  // API endpoint for POST requests (e.g. '/api/v0.1/app/automation')
    headers: SchemaHeader[];            // Complete schema headers array
  };
  initialData?: any;                    // Initial data (optional)
  cancelBtn?: boolean;                  // Display cancel button (default: true)
  noCard?: boolean;                     // Render without wrapping v-card (default: false)
}>()

defineEmits<{
  (e: 'created', response: any): void;  // Emitted upon successful API creation
  (e: 'submit', response: any): void;   // Emitted upon submission
  (e: 'cancel'): void;                  // Emitted on cancellation
  (e: 'valid', isValid: boolean): void; // Validation state changes
}>()
```

### Usage Example
```vue
<template>
  <FormCreate
    ref="formCreateRef"
    :meta="automationMeta"
    @created="onCreated"
    @cancel="showCreate = false"
  />
</template>

<script setup lang="ts">
import FormCreate from '#ba/components/form/form_create.vue';
import automationMetaFcn from '~/schemas/automation';
import myCustomChooser from '~/components/my_custom_chooser.vue';

const formCreateRef = ref();
const automationMeta = ref();

onMounted(async () => {
  automationMeta.value = await automationMetaFcn(useI18n().t);
});

// Register custom fields if needed
watch(formCreateRef, (instance) => {
  if (instance) {
    instance.register('automation_task_chooser', myCustomChooser);
  }
});

const onCreated = (res: any) => {
  console.log('Created record:', res);
};
</script>
```

---

## 3. Sub-components (`set_type` Registry)

The form engine matches `header.set_type` to specialized input components located in `app/components/form/set/`.
Options that only a widget uses go under `header.opts`; the root of a header holds what the form itself uses
(`key`, `title`, `set_type`, `get_type`, `rules`, `default`, `hidden`).

### A. FormSetStringLine (`set_type: 'string_line'`)
Single-line text input using `v-text-field`.
* **opts**: `type` (input type, e.g. `'password'`), `placeholder`

### B. FormSetStringSecret (`set_type: 'string_secret'`)
Password/secret input with visibility toggle icon (`mdi-eye` / `mdi-eye-off`).

### C. FormSetStringArea (`set_type: 'string_area'`)
Multi-line text input using `v-textarea`.
* **opts**: `placeholder`, `rows` (default 3), `auto_grow` (default true), `max_chars` (shows a character counter at the lower right, red when exceeded; pair it with a rule that enforces the limit)

### D. FormSetEnum (`set_type: 'enum'`)
Select dropdown using `v-select` or `v-autocomplete`.
* **opts**:
  * `enum_values`: Array of string options, `{ title, value }` objects, or an async function `(header, formData) => Promise<any[]>`.

### E. FormSetStrarrChips (`set_type: 'strarr_chips'`)
Multi-item tag/chip input using `v-combobox` with removable chips.
* **opts**: `enum_values` (`{ id, name }` items), `color_delimiter` (chips are colored by the text before it, e.g. `':'`; the `list_tag` table getter reads the same opts)

### F. FormSetBoolean (`set_type: 'boolean'`)
Boolean toggle input using `v-switch` or `v-checkbox`.
* **opts**: `set_as_number` (stores 1/0 instead of true/false)

### G. FormSetInteger (`set_type: 'integer'`)
Numeric input enforcing integer values.
* **opts**: `min`, `max`, `step`

### H. FormSetPasswordConfirm (`set_type: 'password_confirm'`)
Paired password and confirmation fields with automatic mismatch validation.

### I. FormSetForm (`set_type: 'form'`)
Nested sub-form rendering dynamic child schemas.
* **opts**:
  * `nested_headers`: The sub-form's headers, or a function `(header, formData) => SchemaHeader[] | Promise<SchemaHeader[]>` returning them based on parent field values.

### J. FormSetNote (`set_type: 'note'`)
Display-only text; has no value and adds nothing to the submitted data. `title`, if set, is shown as a small label above it.
* **opts**:
  * `text`: An i18n key, or `[key, args]` for a message with parameters; text that isn't a key is shown as is. Line breaks are kept.
  * `color`: A theme color (`'primary'`, `'error'`, ...) for the text; default is the normal text color.

```typescript
{ key: 'imap_hint', set_type: 'note', opts: { text: 'sources.types.imap.hint' } }
```

---

## 4. Validation Rules & Zod Integration

Validation rules are defined in the schema headers using either simple validation functions or rules generated from shared Zod schemas (`shared/rules/`):

```typescript
{
  title: 'Automation Name',
  key: 'name',
  set_type: 'string_line',
  rules: [
    (v: string) => !!v || 'Name is required',
    (v: string) => (v && v.length <= 64) || 'Max 64 characters'
  ]
}
```
