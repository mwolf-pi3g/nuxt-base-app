# Schema-Driven Table Component (`Table`) Documentation

The `Table` component (`app/components/table/table.vue`) is a high-level, configuration-driven data grid wrapper built on top of Vuetify's `v-data-table`. It orchestrates data fetching, pagination, CRUD operations (Create, Read, Update, Delete, Bulk Delete), custom toolbar actions, batch multi-item actions (`customMulti`), and cell formatting based on a central schema design.

---

## 1. What It Does
* **Automated Data Fetching**: Retrieves records from the backend API automatically on mount or state reload using the configured `path_base`.
* **Integrated Form Editor**: Seamlessly transitions between a table list grid view and a `FormWrapper` editor view for creating or modifying records inline.
* **Cell Formatting Registry**: Uses dedicated read-only sub-components (`app/components/table/get/`) to render cell contents dynamically based on `header.get_type`.
* **Built-in CRUD Operations**: Integrates standard network calls (`apiGet`, `apiPost`, `apiPatch`, `apiDelete`) to perform backend actions without writing duplicate controller logic.
* **Toolbar Custom Actions (`customAdd`)**: Supports adding custom buttons to the top-right toolbar next to the create button.
* **Selection Batch Actions (`customMulti`)**: Supports adding multi-item batch action buttons on the left toolbar next to the title that activate when one or more rows are selected.
* **Row-Level Custom Actions (`customActions`)**: Supports adding custom action icons per row in the actions column.

---

## 2. Component Interface (Props & Exposed Properties)

```typescript
defineProps<{
  meta: {
    title: string | [string, ...any[]]; // Heading title for the table toolbar
    path_base: string;                  // Base API path (e.g. '/api/v0.1/app/email')
    headers: SchemaHeader[];            // Field schemas detailing table/form definitions
    features?: TableFeature[];          // Enabled interactions ('create', 'update', etc.)
    readOnMount?: boolean;              // Automatically fetch data on mount
    read_options?: string;              // Query string filters (e.g., 'active=true')
    customAdd?: CustomAddBtn[];         // Custom buttons placed on the right toolbar
    customActions?: RowAction[];        // Custom actions in the row actions column
    customMulti?: CustomMultiAction[];  // Batch action buttons shown when rows are selected
  };
  model?: any[];                        // Preloaded array of items (bypasses automatic fetching)
}>()
```

### Supported Features (`meta.features`)
* `'create'`: Displays a `+` button in the toolbar which opens the child `FormWrapper` in creation mode. Calls `POST [path_base]`.
* `'update'`: Adds a pencil edit icon to each row. Automatically switches to the `FormWrapper` with seeded values. Calls `PATCH [path_base]/:id`.
* `'delete'`: Adds a trash delete icon to each row. Triggers a confirmation dialog and makes a `DELETE [path_base]/:id` call.
* `'deleteMany'`: Enables multi-row selection checkboxes. Shows a trash icon in the toolbar for deleting all selected items at once.
* `'singular'`: Hides pagination controls and table footer (useful for single-record views).

### Exposed Methods & Refs (`defineExpose`)
* `selected`: Reactive array ref of currently checked/selected table row items.
* `formulate`: Ref to the child `FormWrapper` component instance.
* `openCreate()`: Programmatically opens the inline creation form.
* `openEdit(target)`: Programmatically opens the inline edit form for a specific item (by ID or object).
* `loadData()`: Triggers a reload of data from `path_base`.
* `localModel`: Reactive ref of the current table items array.

---

## 3. Custom Action Configurations

### A. Selection Batch Actions (`meta.customMulti`)
Buttons placed next to the table title and delete-all button that become visible when `selected.length > 0`. When clicked, the table automatically passes the selected rows to `onClick`, clears the selection, and reloads the table.

```typescript
customMulti: [
  {
    icon: 'mdi-test-tube',
    tooltip: 'Set as Staging Item',
    color?: 'primary', // Optional color (defaults to neutral toolbar color if omitted)
    onClick: async (selectedItems: any[]) => {
      const ids = selectedItems.map(item => item.id);
      await apiPost('/api/v0.1/app/email/set_staging', { ids, staging_item: 1 });
    }
  }
]
```

### B. Toolbar Custom Actions (`meta.customAdd`)
Buttons placed on the right side of the toolbar next to the create `+` button:

```typescript
customAdd: [
  {
    icon: 'mdi-sync',
    tooltip: 'Sync Data',
    color: 'primary',
    onClick: async () => {
      await apiPost('/api/v0.1/app/sync', {});
    }
  }
]
```

### C. Row Actions (`meta.customActions`)
Custom icons added to each row's actions column:

```typescript
customActions: [
  {
    icon: 'mdi-eye-outline',
    tooltip: 'View Details',
    color: 'primary',
    onActionClick: (item: any) => {
      // Direct click handler receiving the row item
      console.log('Viewing item:', item);
    }
  },
  {
    icon: 'mdi-file-edit-outline',
    tooltip: 'Custom Edit',
    action: 'custom_edit', // Filters schema headers with actions: ['custom_edit']
    onFormSubmit: async (id: string, formData: any) => {
      await apiPatch(`/api/v0.1/app/custom/${id}`, formData);
    }
  }
]
```

---

## 4. General Schema Configuration Keys

Field columns are defined inside the `headers` schema array:

```typescript
interface SchemaHeader {
  title: string | [string, ...any[]]; // Label displayed in table header column or i18n tuple
  key: string;                        // Field key from the database record/JSON payload
  get_type?: string;                  // Key specifying how to render the data in cell view
  set_type?: string;                  // Key specifying how to edit the data (passed to FormWrapper)
  actions?: string[];                 // Filters which forms display this field (e.g. ['create'])
  sortable?: boolean;                 // Enables or disables column header sorting
  enum_values?: any[] | Function;     // Dropdown or tag options for enum types
}
```

---

## 5. Sub-components (`get_type` Registry)

When rendering cells, the table loops through headers and matches `header.get_type` with these sub-components located in `app/components/table/get/`:

### A. TableGetString (`get_type: 'string'`)
Renders the value directly inside a standard text `span`.
* **Props**: `model: string`

### B. TableGetEnum (`get_type: 'enum'`)
Outputs the single-select value, or joined comma-separated values if the model is an array, inside a text `span`.
* **Props**: `model: string | string[]`, `enum_values?: any[]`

### C. TableGetEnumTag (`get_type: 'enum_tag'`)
Accepts an index array of booleans (`boolean[]`) representing which options are selected. It displays active options as compact, colored chip badges.
* **Props**: `model: boolean[]`, `enumValues: string | string[]`

### D. TableGetListTag (`get_type: 'list_tag'`)
Renders a string array (`string[]`) as a row of colored chips.
* **Props**:
  * `model: string[]`
  * `color_delimiter?: string`: Delimiter used to split value text for generating hash-based chip colors.
  * `enum_values?: {id: string, name: string}[]`: Maps string IDs to readable display names.
* **Behavior**: Renders up to 3 chips before collapsing extra entries into a `(+N)` indicator. Displays the complete list inside a tooltip on hover.

### E. TableGetBoolean (`get_type: 'boolean'`)
Displays status toggles as icons instead of text.
* **Props**: `model: boolean | number`
* **Behavior**: Renders a green checkmark circle (`mdi-check-circle-outline`) if truthy (or `1`), and a grey hollow circle (`mdi-circle-outline`) if falsey.

### F. TableGetHidden (`get_type: 'hidden'`)
Masks sensitive fields like passwords, API keys, or tokens with an asterisk (`*`).

### G. TableGetShortDate (`get_type: 'short_date'`)
Formats timestamps or date objects into a compact format: `HH:MM DD.MM.YY`.

### H. TableGetGmailLink (`get_type: 'gmail_link'`)
Renders a Gmail icon button (`mdi-gmail`) linking directly to search queries for the specific message ID.

---

## 6. Complete Usage Example

```typescript
import { apiPost } from '#ba/utils/fetch/wrappers';

export default function (t: any, callbacks?: { onViewEmail?: (item: any) => void }) {
  return {
    title: 'table.email.title',
    headers: [
      { title: 'table.email.date', key: 'date', get_type: 'short_date' },
      { title: 'table.email.from', key: 'from', get_type: 'string' },
      { title: 'table.email.subject', key: 'subject', get_type: 'string' },
      { title: 'table.email.staging', key: 'staging_item', get_type: 'boolean' },
      { title: 'table.common.actions', key: 'actions', sortable: false }
    ],
    path_base: '/api/v0.1/app/email',
    features: ['delete', 'deleteMany'],
    readOnMount: true,
    customActions: [
      {
        icon: 'mdi-eye-outline',
        tooltip: t('table.common.view') || 'View Email',
        onActionClick: callbacks?.onViewEmail
      }
    ],
    customMulti: [
      {
        icon: 'mdi-test-tube',
        tooltip: t('table.email.set_staging') || 'Set Staging',
        onClick: async (selected: any[]) => {
          const ids = selected.map(s => s.id);
          await apiPost('/api/v0.1/app/email/set_staging', { ids, staging_item: 1 });
        }
      },
      {
        icon: 'mdi-test-tube-off',
        tooltip: t('table.email.clear_staging') || 'Clear Staging',
        onClick: async (selected: any[]) => {
          const ids = selected.map(s => s.id);
          await apiPost('/api/v0.1/app/email/set_staging', { ids, staging_item: 0 });
        }
      }
    ]
  };
}
```
