# Schema-Driven Form Component (`FormWrapper`) Documentation

The `FormWrapper` component (`app/components/form/form.vue`) is a highly dynamic, configuration-driven form builder powered by Vuetify. It automatically renders form inputs, controls state binding, and executes translations and validation rules based on a JSON-like schema (headers).

---

## 1. What It Does
* **Automatic Layout Generation**: Iterates through a schema array (`headers`) to render appropriate input fields based on control types (`set_type`).
* **State Management**: Seed and bind values reactively using a local `formData` object. Supports default fallbacks.
* **Nested Forms Support**: Allows nesting child forms within the parent layout, coordinating validity checks across all sub-forms.
* **Validation & Localized Errors**: Translates validation messages dynamically on submit/input using `vue-i18n`.

---

## 2. Component Interface (Props & Events)

### Props
| Prop Name | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `headers` | `any[]` | *Required* | The form schema specifying field names, keys, types, rules, and options. |
| `initialData` | `any` | `undefined` | Key-value pairs representing pre-existing values to seed the form. |
| `cancelBtn` | `boolean` | `true` | Show or hide the Cancel action button. |
| `loading` | `boolean` | `false` | Sets a loading state (e.g. spinner on the Submit button). |
| `noCard` | `boolean` | `false` | Renders form controls inside a simple `div` container instead of a bordered `v-card`. |
| `noSubmit` | `boolean` | `false` | Disables the default footer actions (Submit/Cancel) – useful for sub-form mode. |

### Events
* `@submit`: Emits the copy of `formData` when all rules are satisfied and the form is valid.
* `@cancel`: Emits when the cancel button is clicked.
* `@valid`: Emits a `boolean` signifying whether the form validation state has changed.

---

## 3. General Schema Configuration Keys

Every object inside the `headers` array represents a form field:

```typescript
interface SchemaHeader {
  title: string;              // Input label (translated or raw text)
  key: string;                // Field key name in the persisted object / API payload
  set_type: string;           // Input component selector (e.g. 'string_line')
  default?: any;              // Fallback value if no initialData is present
  rules?: Array<(v: any) => boolean | string>; // Synchronous Zod / callback validation rules
}
```

---

## 4. Sub-components & Specialized Configuration Keys

Formulate divides fields into discrete components nested under `app/components/form/set/`.

### A. FormSetStringLine (`set_type: 'string_line'`)
Renders a standard single-line text input field (`v-text-field`).
* **Specific Keys**:
  * `type` *(string, optional)*: Overrides input type (e.g., `'text'`, `'number'`, `'password'`). Defaults to `'text'`.
  * `default` *(string, optional)*: Fallback default string (defaults to `''`).

### B. FormSetStringArea (`set_type: 'string_area'`)
Renders a multi-line text input text area (`v-textarea`).
* **Specific Keys**:
  * `rows` *(number, optional)*: Height of the textarea in lines. Defaults to `3`.
  * `auto_grow` *(boolean, optional)*: Enables auto-growing input height. Defaults to `true`.
  * `default` *(string, optional)*: Fallback default string (defaults to `''`).

### C. FormSetEnum (`set_type: 'enum'`)
Renders a single-select dropdown selection (`v-select`).
* **Specific Keys**:
  * `enum_values` *(string[] | string, required)*:
    * An array of raw options, or
    * An i18n translation path (string) resolving to an array of values.

### D. FormSetEnumTag (`set_type: 'enum'` with `select_type: 'multiple'`)
Renders a multi-select dropdown targeting array storage where selections are mapped to/from a boolean array.
* **Specific Keys**:
  * `select_type` *(string, required)*: Must be set to `'multiple'` to route to this sub-component.
  * `enum_values` *(string[] | string, required)*: Array or translation path of selectable choices.
* **State Behavior**: Exposes the choice values via an internal index mapper and communicates with the parent using `boolean[]` representing selection indices.

### E. FormSetStrarrChips (`set_type: 'strarr_chips'`)
Renders a multi-select combobox suitable for entering and managing arrays of strings (e.g., tags, roles, targets). Selected items are rendered as customizable colored chips.
* **Specific Keys**:
  * `enum_values` *(any[], optional)*: Predefined options. If not supplied, defaults to selected values.
  * `color_delimiter` *(string, optional)*: Splits choice labels to dynamically derive a hash-based color (via `strColor` utility) for styling the chip. Show up to 3 chips before rendering a `(+N)` indicator.

### F. FormSetPasswordConfirm (`set_type: 'password_confirm'`)
Renders two adjacent password input fields: Primary and Confirmation.
* **Behavior**: Binds/emits the primary password value on update. The confirmation input has built-in verification rules (`rules.password.required` and `rules.password.mismatch`). The parent form remains invalid unless both passwords match.

### G. FormSetBoolean (`set_type: 'boolean'`)
Renders a standard checkbox input toggle (`v-checkbox`).
* **Specific Keys**:
  * `set_as_number` *(boolean, optional)*: If set to `true`, emits `1` or `0` to parent state instead of `true` or `false`.

### H. FormSetInteger (`set_type: 'integer'`)
Renders a numeric stepper input field (`v-number-input`).
* **Specific Keys**:
  * `min` *(number, optional)*: The minimum allowed value.
  * `max` *(number, optional)*: The maximum allowed value.
  * `step` *(number, optional)*: The step interval. Defaults to `1`.

### I. FormSetForm (`set_type: 'form'`)
Renders a nested sub-form container, enabling dynamic forms whose structures depend on prior field states (e.g., showing provider-specific settings dynamically).
* **Specific Keys**:
  * `value` *(Array | Function, required)*:
    * A static schema array, or
    * A function/callback: `(header, formData) => Promise<any[]>` or `(header, formData) => any[]`.
* **State Behavior**: Watches the parent's `formData` reactively and regenerates the schema. Validity updates of the child form are bubble-emitted to parent `isFormValid` calculations.

---

## 5. Usage Example

Below is a configuration illustrating different fields, including a dynamic sub-form:

```typescript
const headers = [
  // 1. Basic String Line
  { 
    title: 'Account Name', 
    key: 'name', 
    set_type: 'string_line',
    rules: [(v) => !!v || 'Name is required']
  },
  // 2. Select Dropdown (Enum)
  { 
    title: 'Provider', 
    key: 'provider', 
    set_type: 'enum', 
    enum_values: ['Apprise', 'Email'] 
  },
  // 3. Dynamic Sub-form depending on 'provider' value
  { 
    title: 'Configuration Details', 
    key: 'config', 
    set_type: 'form',
    value: async (header, formData) => {
      if (formData.provider === 'Apprise') {
        return [
          { title: 'Template URL', key: 'template', set_type: 'string_line' },
          { title: 'API Key', key: 'apikey', set_type: 'string_line' }
        ];
      }
      return [];
    }
  }
];
```