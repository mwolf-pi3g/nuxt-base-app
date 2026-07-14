import { handleApiAlert } from './alert_handler';

export const apiGet = async <T = any>(url: string) => {
  try {
    const res = await $fetch<T>(url, { method: 'GET' });
    handleApiAlert(res, 200);
    return res;
  } catch (error: any) {
    handleApiAlert(error.data, error.statusCode || 500);
    throw error;
  }
}

export const apiPost = async <T = any>(url: string, body: any) => {
  try {
    const res = await $fetch<T>(url, { method: 'POST', body });
    handleApiAlert(res, 200);
    return res;
  } catch (error: any) {
    handleApiAlert(error.data, error.statusCode || 500);
    throw error;
  }
}

export const apiPatch = async <T = any>(url: string, body: any) => {
  try {
    const res = await $fetch<T>(url, { method: 'PATCH', body });
    handleApiAlert(res, 200);
    return res;
  } catch (error: any) {
    handleApiAlert(error.data, error.statusCode || 500);
    throw error;
  }
}

export const apiDelete = async <T = any>(url: string) => {
  try {
    const res = await $fetch<T>(url, { method: 'DELETE' });
    handleApiAlert(res, 200);
    return res;
  } catch (error: any) {
    handleApiAlert(error.data, error.statusCode || 500);
    throw error;
  }
}