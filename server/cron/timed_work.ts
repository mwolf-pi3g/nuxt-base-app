import { defineCronHandler } from '#nuxt/cron'

export default defineCronHandler(() => '0 0 * * * *', async () => {
  console.log('CRON: Doing work' + new Date().toISOString())
})
