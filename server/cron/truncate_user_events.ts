import { defineCronHandler } from '#nuxt/cron'
import { db } from 'hub:db'
import { userEvents } from '#bs/db/schema'
import { lt } from 'drizzle-orm'
import { appLimits } from '#bs/utils/app_limits'

export default defineCronHandler(() => '0 0 0 * * *', async () => {
  console.log('CRON: Truncating user events start: ' + new Date().toISOString())

  try {
    const retentionDays = appLimits().user_events.retention_days
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000)
    // Events stay until the user deletes them (bell, dashboard) or they are older than the retention
    const deletedEvents = await db.delete(userEvents)
      .where(lt(userEvents.createdAt, cutoffDate))
      .returning()

    console.log(`[Truncate User Events] Successfully deleted ${deletedEvents.length} user event(s) (older than ${retentionDays} days, before ${cutoffDate.toISOString()}).`)
  } catch (error) {
    console.error('[Truncate User Events] Truncating user events failed with error:', error)
  }

  console.log('CRON: Truncating user events complete: ' + new Date().toISOString())
})
