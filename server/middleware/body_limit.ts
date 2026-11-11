import { appLimits } from '#bs/utils/app_limits'

// Refuses request bodies over limits.http.max_body_mb (LIMITS_HTTP_MAX_BODY_MB) before any route reads them.
// Judged by the Content-Length header; a body without one (chunked) is not limited here.
export default defineEventHandler((event) => {
  const length = Number(getRequestHeader(event, 'content-length') || 0)
  const max = appLimits().http.max_body_mb * 1024 * 1024
  if (length > max) {
    throw createError({ statusCode: 413, statusMessage: 'error request.too_large', data: { max_mb: appLimits().http.max_body_mb } })
  }
})
