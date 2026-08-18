# Notification Provider Registry Specification

## Overview

The Notification Architecture decouples core persistence and routing from specific provider implementations (e.g., Apprise, IMAP, Custom Webhooks). 

Core routing and schema discovery rely on a centralized **Notification Provider Registry** (`notificationProviderRegistry`). Any service instance created via `getServiceNoAuth`, `getService`, or `getAdminService` accesses this shared registry of registered providers.

---

## Architecture & Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│               Nitro Plugin Registration Boot                │
│  (e.g., server/plugins/core_notification_registration.ts)   │
└──────────────────────────────┬──────────────────────────────┘
                               │ registers Provider Class
                               ▼
     ┌──────────────────────────────────────────────────┐
     │           notificationProviderRegistry           │
     │ (server/utils/notifications_provider_registry)  │
     └─────────────────────────┬────────────────────────┘
                               │ shared state
          ┌────────────────────┼────────────────────┐
          ▼                    ▼                    ▼
  getServiceNoAuth()       getService()      getAdminService()
          │                    │                    │
          └────────────────────┴────────────────────┘
                               │
                               ▼
                      notificationService
```

---

## Default Provider: Apprise

By default, the platform registers **Apprise** as a notification provider at startup:

* **File Location**: `server/services/core/notification_apprise.ts`
* **Registration Plugin**: `server/plugins/core_notification_registration.ts`
* **Provider Key**: `apprise`

```ts
import { notificationProviderRegistry } from '#bs/utils/notifications_provider_registry';
import { Apprise } from '#bs/services/core/notification_apprise';

export default defineNitroPlugin((_nitroApp) => {
  notificationProviderRegistry.registerProvider('apprise', Apprise);
});
```

---

## Provider Interface Requirements

To register a new notification provider, create a static class or object conforming to the following contract.

### 1. `getSchemas()` Method

MUST return a Promise or array of service schema definitions.

* **Signature**: `getSchemas(): Promise<Array<ServiceSchema>>`
* **Schema Format**:

```ts
interface ServiceSchema {
  service_name: string; // Service identifier (e.g., "mailto", "slack", "telegram")
  details: {
    templates: string[]; // List of template strings (e.g., "mailto://{user}:{pass}@{host}:{port}")
    tokens: Record<string, {
      name: string;      // Display name of the field token
      type: 'string' | 'int' | 'bool' | 'choice:string' | 'choice:int' | 'list:string';
      required?: boolean;
      min?: number;
      max?: number;
      regex?: [pattern: string, flags?: string];
      values?: string[] | number[];
    }>;
  };
}
```

### 2. `sendItems(title, items, options)` Method

MUST process and deliver notification payloads to the destination specified in `options.channel`.

* **Signature**: `sendItems(title: string, items: Array<{ content: string; mime_type?: string }> | string, options: { channel: Record<string, any> }): Promise<any>`
* **Parameters**:
  * `title`: Subject / title of the notification message.
  * `items`: Notification content payload (array of items with `content` and optional `mime_type`, or a raw string).
  * `options`: Context object containing the database channel record (`options.channel`), which includes `provider`, `type`, `config`, etc.

---

## Registering a Custom Provider

### Step 1: Implement the Provider Class

Create your provider implementation file in `server/services/core/notification_<provider>.ts`:

```ts
// server/services/core/notification_custom.ts
export class CustomNotificationProvider {
  static async getSchemas() {
    return [
      {
        service_name: 'custom_webhook',
        details: {
          templates: ['https://{host}:{port}/webhook'],
          tokens: {
            host: { name: 'Host', type: 'string', required: true },
            port: { name: 'Port', type: 'int', min: 1, max: 65535 },
            token: { name: 'Token', type: 'string' }
          }
        }
      }
    ];
  }

  static async sendItems(title: string, items: any, options: { channel: any }) {
    const { config } = options.channel;
    // Dispatch custom webhook request...
    console.log(`Sending custom notification '${title}' using config:`, config);
  }
}
```

### Step 2: Register in a Nitro Plugin

Create a Nitro plugin in `server/plugins/custom_notification_registration.ts`:

```ts
// server/plugins/custom_notification_registration.ts
import { notificationProviderRegistry } from '#bs/utils/notifications_provider_registry';
import { CustomNotificationProvider } from '#bs/services/core/notification_custom';

export default defineNitroPlugin((_nitroApp) => {
  notificationProviderRegistry.registerProvider('custom', CustomNotificationProvider);
});
```

---

## Related API Endpoints

Once registered, provider schemas are automatically exposed via the user API endpoints:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/user/notification/schema` | Returns aggregated schemas for all registered providers (`{ apprise: [...], custom: [...] }`). |
| `GET` | `/api/user/notification/schema/services` | Returns map of registered providers to available service type arrays (`{ apprise: ['mailto', 'slack'], custom: ['custom_webhook'] }`). |
| `GET` | `/api/user/notification/schema/services/:provider/:service` | Returns the schema details for a specific provider and service (e.g. `/api/user/notification/schema/services/custom/custom_webhook`). |
