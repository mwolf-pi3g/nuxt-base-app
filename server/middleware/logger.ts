// Logs every request URL; LOG_REQUESTS=false switches it off (default: on)
const enabled = !/^(false|0|no)$/i.test(process.env.LOG_REQUESTS?.trim() ?? '')

export default defineEventHandler((event) => {
    if (!enabled) return
    // with short date and time
    const timestamp = new Date().toISOString().slice(0, 19);
    console.log(timestamp + ' Request: ' + getRequestURL(event))
})
