export default defineEventHandler(async (event) => {
  await clearUserSession(event);
  return {
    statusMessage: 'success auth.logout.success',
  };
});
