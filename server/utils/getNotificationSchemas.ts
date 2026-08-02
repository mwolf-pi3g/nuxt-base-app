export const getNotificationSchemas = async () => {
  if ((globalThis as any).notificationSchemas) {
    return (globalThis as any).notificationSchemas;
  }

  const appriseUrl = process.env.APPRISE_URL || 'http://localhost';
  const url = `${appriseUrl.replace(/\/$/, '')}/details`;

  try {
    const res = await $fetch<any>(url, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (res && Array.isArray(res.schemas)) {
      for (const item of res.schemas) {
        if (item && typeof item === 'object') {
          delete item.args;
          delete item.setup_url;
          if (item.details && typeof item.details === 'object') {
            delete item.details.args;
          }
        }
      }
    }

    (globalThis as any).notificationSchemas = res;
    return res;
  } catch (error: any) {
    throw new Error(error?.message || 'error notification.schema.failed');
  }
};
