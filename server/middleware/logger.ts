export default defineEventHandler((event) => {
    // with short date and time
    const timestamp = new Date().toISOString().slice(0, 19);
    console.log(timestamp + ' Request: ' + getRequestURL(event))
})