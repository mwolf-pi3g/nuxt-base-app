# Schema-Driven Table Component (`Table`) Documentation

The `Table` component (`app/components/table/table.vue`) is a high-level, configuration-driven data grid wrapper built on top of Vuetify's `v-data-table`. It orchestrates data fetching, pagination, CRUD operations (Create, Read, Update, Delete, Bulk Delete), custom toolbar actions, and cell formatting based on a central schema design.

---

## 1. What It Does
* **Automated Data Fetching**: Retrieves records from the backend API automatically on mount or state reload using the base path.
* **Integrated Form Editor**: Seamlessly transitions between a table list grid view and a `FormWrapper` editor view for creating or modifying records inline.
* **Cell Formatting Registry**: Uses a series of dedicated read-only sub-components (`app/components/table/get/`) to render cell contents dynamically based on the schema's `get_type` parameter.
* **Built-in CRUD Mechanics**: Integrates standard network calls (`apiGet`, `apiPost`, `apiPatch`, `apiDelete`) to perform backend actions without writing duplicate controller logic.
* **Custom Extensibility**: Supports adding custom buttons to the table's toolbar (`customAdd`) and custom row-level actions (`customActions`).

---

## 2. Component Interface (Props)

The component receives a `meta` configuration object and an optional `model` data array:

```typescript
defineProps<{
  meta: {
    title: string;              // Heading title for the table toolbar
    path_base: string;          // Base API path (e.g. '/api/user/notification')
    headers: SchemaHeader[];    // Field schemas detailing table/form definitions
    features: TableFeature[];   // Enabled interactions ('create', 'update', etc.)
    readOnMount: boolean;       // Automatically fetch data on mount
    read_options?: string;      // Query string filters (e.g., 'active=true')
    customAdd?: CustomAddBtn[]; // Custom buttons placed on the toolbar
    customActions?: RowAction[];// Custom actions in the actions column
  };
  model?: any[];                // Preloaded array of items (bypasses automatic fetching)
}>()
```

### Supported Features (`meta.features`)
* `'create'`: Displays a `+` button in the toolbar which opens the child `FormWrapper` in creation mode. Calls `POST [path_base]`.
* `'update'`: Adds a pencil edit icon to each row. Automatically switches to the `FormWrapper` with seeded values. Calls `PATCH [path_base]/:id`.
* `'delete'`: Adds a trash delete icon to each row. Triggers a confirmation dialog and makes a `DELETE [path_base]/:id` call.
* `'deleteMany'`: Enables multi-row selection checkboxes. Shows a trash icon in the toolbar for deleting all selected items at once.
* `'singular'`: Hides pagination controls and table footer (useful for single-record views).

---

## 3. General Schema Configuration Keys

Field columns are defined inside the `headers` schema array. The table uses specific properties to handle listing:

```typescript
interface SchemaHeader {
  title: string;              // Label displayed in the table header column
  key: string;                // Field key from the database record/JSON payload
  get_type?: string;          // Key specifying how to render the data in cell view
  set_type?: string;          // Key specifying how to edit the data (passed to FormWrapper)
  actions?: string[];         // Filters which forms display this field (e.g. ['create'])
  sortable?: boolean;         // Enables or disables column header sorting
}
```

---

## 4. Sub-components (`get_type` Registry)

When rendering cells, the table loops through headers and matches `header.get_type` with these components:

### A. TableGetString (`get_type: 'string'`)
Renders the value directly inside a standard text `span`.
* **Props**: `model: string`

### B. TableGetEnum (`get_type: 'enum'`)
Outputs the single-select value, or joined comma-separated values if the model is an array, inside a text `span`.
* **Props**: `model: string | string[]`

### C. TableGetEnumTag (`get_type: 'enum_tag'`)
Accepts an index array of booleans (`boolean[]`) representing which options are selected. It displays active options as compact, colored chip badges.
* **Props**: `model: boolean[]`, `enumValues: string | string[]` (predefined list or translation path key).

### D. TableGetListTag (`get_type: 'list_tag'`)
Renders a string array (`string[]`) as a row of colored chips.
* **Props**:
  * `model: string[]`
  * `color_delimiter?: string`: Delimiter used to split value text for generating hash-based chip colors.
  * `enum_values?: {id: string, name: string}[]`: Maps string IDs to readable display names.
* **Behavior**: Renders up to 3 chips before collapsing extra entries into a `(+N)` indicator. Displays the complete list of elements inside a tooltip when hovered.

### E. TableGetBoolean (`get_type: 'boolean'`)
Displays status toggles as icons instead of text.
* **Props**: `model: boolean | number`
* **Behavior**: Renders a green checkmark circle (`mdi-check-circle-outline`) if the value is truthy (or `1`), and a grey hollow circle (`mdi-circle-outline`) if falsey.

### F. TableGetHidden (`get_type: 'hidden'`)
Masks sensitive fields like passwords, API keys, or tokens.
* **Behavior**: Outputs a fallback asterisk (`*`) symbol instead of rendering the raw database string.

### G. TableGetShortDate (`get_type: 'short_date'`)
Formats timestamps or date objects into a unified, compact format.
* **Props**: `model: string | Date | number`
* **Behavior**: Renders dates in the format `HH:MM DD.MM.YY`. Falls back to the raw string representation if date parsing fails.

### H. TableGetGmailLink (`get_type: 'gmail_link'`)
Renders a Gmail icon button (`mdi-gmail`) linking directly to search queries for the specific message ID.
* **Props**: `model: string` (RFC 822 Message ID)
* **Behavior**: Opens a search query (`https://mail.google.com/mail/u/0/#search/rfc822msgid:...`) in a new browser tab. Hovering over the icon shows the message ID inside a tooltip.

---

## 5. Usage Example

Here is a schema configuration connecting table listing properties, customized fields, and form controls:

```typescript
export default async function (t: any) {
  return {
    title: t('table.notification_channels.title'),
    path_base: '/api/user/notification',
    readOnMount: true,
    features: ['create', 'update', 'delete', 'deleteMany'],
    headers: [
      {
        title: t('table.notification_channels.name'),
        key: 'name',
        get_type: 'string',
        set_type: 'string_line'
      },
      {
        title: t('table.notification_channels.is_default'),
        key: 'is_default',
        get_type: 'boolean',
        set_type: 'boolean'
      },
      {
        title: t('table.notification_channels.created_at'),
        key: 'created_at',
        get_type: 'short_date',
        actions: ['read'] // Excludes field from create/update forms
      },
      {
        title: t('table.common.actions'),
        key: 'actions',
        sortable: false
      }
    ]
  };
}
```
