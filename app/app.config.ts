// Defaults of the base layer's app config; an app overrides them in its own app/app.config.ts.
export default defineAppConfig({
  // The bell (components/user_events.vue)
  userEvents: {
    // Event categories the bell leaves out (they are shown elsewhere in the app)
    excludeCategories: [] as string[],
    // One line per category with warnings or errors, e.g. "2 ... have new problems", linking to where
    // they are shown: { category, message (i18n key, gets {count}: distinct metadata.id), to (route) }
    summaries: [] as Array<{ category: string; message: string; to: string }>,
  },
})
