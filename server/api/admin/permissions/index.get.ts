import permissionsJson from '#bs/metadata/permissions.json';

export default defineEventHandler(async (event) => {
  const data: string[] = [];

  for (const [rubric, actions] of Object.entries(permissionsJson)) {
    if (Array.isArray(actions)) {
      for (const action of actions) {
        data.push(`${rubric}.${action}`);
      }
    }
  }

  return {
    data,
    statusMessage: 'success permissions.read.success',
  };
});
