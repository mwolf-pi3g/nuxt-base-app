import { defineCronHandler } from '#nuxt/cron'
import { db } from 'hub:db'
import { userEvents } from '#bs/db/schema'
import { lt, eq, or } from 'drizzle-orm'

export default defineCronHandler(() => '0 0 0 * * *', async () => {
  console.log('CRON: Truncating user events start: ' + new Date().toISOString())

  try {
    const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const deletedEvents = await db.delete(userEvents)
      .where(or(eq(userEvents.read, 1), lt(userEvents.createdAt, cutoffDate)))
      .returning()

    console.log(`[Truncate User Events] Successfully deleted ${deletedEvents.length} user event(s) (read events or older than 30 days before ${cutoffDate.toISOString()}).`)
  } catch (error) {
    console.error('[Truncate User Events] Truncating user events failed with error:', error)
  }

  console.log('CRON: Truncating user events complete: ' + new Date().toISOString())
})
